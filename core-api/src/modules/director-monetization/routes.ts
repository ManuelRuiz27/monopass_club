import { randomUUID } from 'crypto'
import { FastifyInstance } from 'fastify'
import {
  ClubSubscriptionStatus,
  FinanceIsrMode,
  InvoiceStatus,
  InvoiceType,
  LedgerEntryType,
  PaymentMethod,
  PaymentProvider,
  PaymentStatus,
  Prisma,
  SubscriptionBillingPeriod,
  SubscriptionPlanStatus,
} from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { calculateFinanceSummary, calculateInvoiceTotalsFromLineItems, mergeEntitlements, type IsrBracket } from './calculations'
import { buildProviderRegistry } from './paymentProviders'

type JsonMap = Record<string, unknown>

const idParamSchema = z.object({ id: z.string().uuid() })
const providerWebhookParamSchema = z.object({ provider: z.enum(PaymentProvider) })
const paginationSchema = z.object({ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(20) })

const planSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  billingPeriod: z.enum(SubscriptionBillingPeriod),
  priceMxn: z.coerce.number().int().min(0),
  currency: z.string().min(3).max(3).default('MXN'),
  includedEventsPerMonth: z.coerce.number().int().min(0).optional().nullable(),
  entitlements: z.record(z.string(), z.unknown()).optional().nullable(),
  overagePricePerEventMxn: z.coerce.number().int().min(0).optional().nullable(),
  status: z.enum(SubscriptionPlanStatus).default(SubscriptionPlanStatus.active),
})

const subscriptionCreateSchema = z.object({
  clubId: z.string().uuid(),
  planId: z.string().uuid(),
  status: z.enum(ClubSubscriptionStatus).default(ClubSubscriptionStatus.active),
  startAt: z.string().datetime(),
  currentPeriodStart: z.string().datetime(),
  currentPeriodEnd: z.string().datetime(),
  cancelAtPeriodEnd: z.boolean().default(false),
  trialEndAt: z.string().datetime().optional().nullable(),
  seatsHostsLimit: z.coerce.number().int().min(0).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  overrides: z.record(z.string(), z.unknown()).optional().nullable(),
})

const subscriptionPatchSchema = subscriptionCreateSchema
  .omit({ clubId: true, startAt: true })
  .partial()

const invoiceLineItemSchema = z.object({
  description: z.string().min(1),
  qty: z.coerce.number().int().positive(),
  unitPriceMxn: z.coerce.number().int().min(0),
})

const invoiceCreateSchema = z.object({
  clubId: z.string().uuid(),
  subscriptionId: z.string().uuid().optional().nullable(),
  type: z.enum(InvoiceType),
  items: z.array(invoiceLineItemSchema).min(1),
  taxRate: z.coerce.number().min(0).max(1).default(0.16),
  status: z.enum(InvoiceStatus).default(InvoiceStatus.issued),
  issuedAt: z.string().datetime().optional().nullable(),
  dueAt: z.string().datetime().optional().nullable(),
  notes: z.string().optional().nullable(),
})

const paymentCreateSchema = z.object({
  method: z.enum(PaymentMethod),
  provider: z.enum(PaymentProvider).optional().nullable(),
  providerRef: z.string().min(1).optional().nullable(),
  amountMxn: z.coerce.number().int().positive(),
  feeMxn: z.coerce.number().int().min(0).default(0),
  status: z.enum(PaymentStatus).default(PaymentStatus.succeeded),
  createdAt: z.string().datetime().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
})

const refundSchema = z.object({
  amountMxn: z.coerce.number().int().positive().optional(),
  reason: z.string().optional().nullable(),
})

const ledgerEntrySchema = z.object({
  clubId: z.string().uuid().optional().nullable(),
  type: z.enum(LedgerEntryType),
  category: z.string().min(1),
  amountMxn: z.coerce.number().int(),
  occurredAt: z.string().datetime(),
  notes: z.string().optional().nullable(),
  referenceType: z.string().optional().nullable(),
  referenceId: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
})

const financePresetSchema = z.object({
  name: z.string().min(1),
  vatRate: z.coerce.number().min(0).max(1).default(0.16),
  isrMode: z.enum(FinanceIsrMode).default(FinanceIsrMode.none),
  isrRate: z.coerce.number().min(0).max(1).optional().nullable(),
  bracketsJson: z.array(z.object({
    lowerLimitMxn: z.coerce.number().int().min(0).optional(),
    upToMxn: z.coerce.number().int().min(0).nullable().optional(),
    rate: z.coerce.number().min(0).max(1),
    fixedFeeMxn: z.coerce.number().int().min(0).optional(),
  })).optional().nullable(),
  defaultExpenseCategories: z.array(z.string()).optional().nullable(),
  notes: z.string().optional().nullable(),
})

const financeSummaryQuerySchema = z.object({
  dateFrom: z.string().datetime(),
  dateTo: z.string().datetime(),
  presetId: z.string().uuid().optional(),
  incomeMode: z.enum(['gross', 'net']).default('gross'),
  vatRate: z.coerce.number().min(0).max(1).optional(),
  withholdingRate: z.coerce.number().min(0).max(1).optional(),
  isrMode: z.enum(['none', 'simple_rate', 'brackets']).optional(),
  isrRate: z.coerce.number().min(0).max(1).optional(),
  bracketsJson: z.string().optional(),
})

const invoicesQuerySchema = paginationSchema.extend({
  status: z.enum(InvoiceStatus).optional(),
  clubId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
})

const subscriptionsQuerySchema = paginationSchema.extend({
  status: z.enum(ClubSubscriptionStatus).optional(),
  clubId: z.string().uuid().optional(),
  planId: z.string().uuid().optional(),
  q: z.string().optional(),
})

const plansQuerySchema = paginationSchema.extend({
  status: z.enum(SubscriptionPlanStatus).optional(),
  q: z.string().optional(),
})

function toJson(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return value === null ? Prisma.JsonNull : (value as Prisma.InputJsonValue)
}

function jsonObj(value: Prisma.JsonValue | null | undefined): JsonMap {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonMap) : {}
}

function jsonArr<T>(value: Prisma.JsonValue | null | undefined): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function dateOrNull(value: string | null | undefined) {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function pageToSkipTake(page: number, pageSize: number) {
  return { skip: (page - 1) * pageSize, take: pageSize }
}

function currencyMxn(amountMxn: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amountMxn / 100)
}

function csvRow(values: Array<string | number>) {
  return values.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')
}

async function audit(actorUserId: string, action: string, entityType: string, entityId: string, before?: unknown, after?: unknown) {
  const data: Prisma.DirectorAuditLogCreateInput = {
    id: randomUUID(),
    actorUser: { connect: { id: actorUserId } },
    action,
    entityType,
    entityId,
    ...(before !== undefined ? { beforeJson: toJson(before) } : {}),
    ...(after !== undefined ? { afterJson: toJson(after) } : {}),
  }
  await prisma.directorAuditLog.create({
    data,
  })
}

async function requirePlan(app: FastifyInstance, id: string) {
  const row = await prisma.subscriptionPlan.findUnique({ where: { id } })
  if (!row) throw app.httpErrors.notFound('Plan no encontrado')
  return row
}

async function requireSubscription(app: FastifyInstance, id: string) {
  const row = await prisma.subscription.findUnique({ where: { id }, include: { club: true, plan: true } })
  if (!row) throw app.httpErrors.notFound('Suscripcion no encontrada')
  return row
}

async function requireInvoice(app: FastifyInstance, id: string) {
  const row = await prisma.invoice.findUnique({
    where: { id },
    include: {
      club: { select: { id: true, name: true, active: true } },
      subscription: { include: { plan: true } },
      payments: true,
    },
  })
  if (!row) throw app.httpErrors.notFound('Factura no encontrada')
  return row
}

async function requirePayment(app: FastifyInstance, id: string) {
  const row = await prisma.payment.findUnique({ where: { id } })
  if (!row) throw app.httpErrors.notFound('Pago no encontrado')
  return row
}

function serializeSubscription(row: Awaited<ReturnType<typeof requireSubscription>>) {
  const planEntitlements = jsonObj(row.plan.entitlements)
  const overrides = jsonObj(row.overrides)
  return {
    ...row,
    metadata: jsonObj(row.metadata),
    overrides,
    plan: { ...row.plan, entitlements: planEntitlements },
    effectiveEntitlements: mergeEntitlements(planEntitlements, overrides),
  }
}

async function recalcInvoice(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } })
  if (!invoice) return null
  const payments = await prisma.payment.findMany({ where: { invoiceId } })
  const paidMxn = payments.reduce((sum, payment) => {
    if (payment.status === PaymentStatus.succeeded) return sum + payment.amountMxn
    if (payment.status === PaymentStatus.refunded) return sum - payment.amountMxn
    return sum
  }, 0)
  const nextStatus =
    invoice.status === InvoiceStatus.void
      ? InvoiceStatus.void
      : paidMxn >= invoice.totalMxn
        ? InvoiceStatus.paid
        : invoice.status === InvoiceStatus.draft
          ? InvoiceStatus.draft
          : InvoiceStatus.issued
  return prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: nextStatus, paidAt: nextStatus === InvoiceStatus.paid ? invoice.paidAt ?? new Date() : null },
  })
}

function parseBrackets(raw?: string): IsrBracket[] | undefined {
  if (!raw) return undefined
  try {
    const parsed = JSON.parse(raw) as unknown
    return z.array(
      z.object({
        lowerLimitMxn: z.number().int().nonnegative().optional(),
        upToMxn: z.number().int().nonnegative().nullable().optional(),
        rate: z.number().min(0).max(1),
        fixedFeeMxn: z.number().int().nonnegative().optional(),
      }),
    ).parse(parsed) as IsrBracket[]
  } catch {
    return undefined
  }
}

function providerFlags() {
  return {
    [PaymentProvider.manual]: true,
    [PaymentProvider.stripe]: process.env.DIRECTOR_PAYMENTS_STRIPE_ENABLED?.toLowerCase() === 'true',
    [PaymentProvider.conekta]: process.env.DIRECTOR_PAYMENTS_CONEKTA_ENABLED?.toLowerCase() === 'true',
    [PaymentProvider.mercadopago]: process.env.DIRECTOR_PAYMENTS_MERCADOPAGO_ENABLED?.toLowerCase() === 'true',
    [PaymentProvider.openpay]: process.env.DIRECTOR_PAYMENTS_OPENPAY_ENABLED?.toLowerCase() === 'true',
  }
}

function bucketKey(date: Date, granularity: 'day' | 'week' | 'month') {
  if (granularity === 'day') return date.toISOString().slice(0, 10)
  if (granularity === 'month') return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
  const d = new Date(date)
  const day = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - day)
  d.setUTCHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

async function buildFinanceSummary(input: {
  directorUserId: string
  dateFrom: string
  dateTo: string
  presetId?: string
  incomeMode: 'gross' | 'net'
  vatRate?: number
  withholdingRate?: number
  isrMode?: 'none' | 'simple_rate' | 'brackets'
  isrRate?: number
  brackets?: IsrBracket[]
}) {
  const from = new Date(input.dateFrom)
  const to = new Date(input.dateTo)
  const preset = input.presetId
    ? await prisma.financePreset.findFirst({ where: { id: input.presetId, directorUserId: input.directorUserId } })
    : null

  const [paidInvoices, payments, ledgerEntries] = await Promise.all([
    prisma.invoice.findMany({
      where: { status: InvoiceStatus.paid, paidAt: { gte: from, lte: to } },
      select: { totalMxn: true, taxMxn: true },
    }),
    prisma.payment.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { amountMxn: true, feeMxn: true, netMxn: true, status: true },
    }),
    prisma.ledgerEntry.findMany({
      where: { occurredAt: { gte: from, lte: to } },
      select: { type: true, category: true, amountMxn: true, metadata: true },
    }),
  ])

  const paidInvoiceGrossIncomeMxn = paidInvoices.reduce((sum, row) => sum + row.totalMxn, 0)
  const collectedVatMxn = paidInvoices.reduce((sum, row) => sum + row.taxMxn, 0)
  const paidInvoiceNetIncomeMxn = payments.reduce((sum, row) => {
    if (row.status === PaymentStatus.succeeded) return sum + row.netMxn
    if (row.status === PaymentStatus.refunded) return sum - Math.abs(row.netMxn)
    return sum
  }, 0)
  const manualIncomeMxn = ledgerEntries
    .filter((row) => row.type === LedgerEntryType.revenue && row.category !== 'invoice_payment')
    .reduce((sum, row) => sum + Math.max(row.amountMxn, 0), 0)
  const refundsMxn = ledgerEntries.filter((row) => row.type === LedgerEntryType.refund).reduce((sum, row) => sum + Math.abs(row.amountMxn), 0)
  const manualExpensesMxn = ledgerEntries
    .filter((row) => row.type === LedgerEntryType.expense || row.type === LedgerEntryType.adjustment)
    .reduce((sum, row) => sum + Math.abs(row.amountMxn), 0)
  const feesMxn = payments.reduce((sum, row) => sum + Math.max(row.feeMxn, 0), 0)
  const expenseVatMxn = ledgerEntries
    .filter((row) => row.type === LedgerEntryType.expense)
    .reduce((sum, row) => {
      const vatMxn = typeof jsonObj(row.metadata).vatMxn === 'number' ? Math.round(jsonObj(row.metadata).vatMxn as number) : 0
      return sum + Math.max(vatMxn, 0)
    }, 0)

  const result = calculateFinanceSummary({
    paidInvoiceGrossIncomeMxn,
    paidInvoiceNetIncomeMxn,
    manualIncomeMxn,
    expensesMxn: manualExpensesMxn + refundsMxn + feesMxn,
    expenseVatMxn,
    collectedVatMxn,
    incomeMode: input.incomeMode,
    tax: {
      vatRate: input.vatRate ?? preset?.vatRate ?? 0.16,
      withholdingRate: input.withholdingRate ?? 0,
      isrMode: input.isrMode ?? (preset?.isrMode as 'none' | 'simple_rate' | 'brackets' | undefined) ?? 'none',
      isrRate: input.isrRate ?? preset?.isrRate ?? null,
      brackets: input.brackets ?? jsonArr<IsrBracket>(preset?.bracketsJson),
    },
  })

  const rows = [
    ['gross_income_mxn', result.grossIncomeMxn, currencyMxn(result.grossIncomeMxn)],
    ['net_income_mxn', result.netIncomeMxn, currencyMxn(result.netIncomeMxn)],
    ['expenses_mxn', result.expensesMxn, currencyMxn(result.expensesMxn)],
    ['taxable_base_mxn', result.taxableBaseMxn, currencyMxn(result.taxableBaseMxn)],
    ['vat_payable_mxn', result.vatPayableMxn, currencyMxn(result.vatPayableMxn)],
    ['estimated_isr_mxn', result.estimatedIsrMxn, currencyMxn(result.estimatedIsrMxn)],
    ['profit_after_taxes_mxn', result.profitAfterTaxesMxn, currencyMxn(result.profitAfterTaxesMxn)],
    ['effective_tax_rate_pct', Number((result.effectiveTaxRate * 100).toFixed(2)), `${(result.effectiveTaxRate * 100).toFixed(2)}%`],
  ] as const
  const csv = [csvRow(['metric', 'amount', 'formatted']), ...rows.map((row) => csvRow([row[0], row[1], row[2]]))].join('\n')

  return {
    period: { dateFrom: input.dateFrom, dateTo: input.dateTo },
    settings: {
      presetId: preset?.id ?? null,
      incomeMode: input.incomeMode,
      vatRate: input.vatRate ?? preset?.vatRate ?? 0.16,
      withholdingRate: input.withholdingRate ?? 0,
      isrMode: input.isrMode ?? (preset?.isrMode as 'none' | 'simple_rate' | 'brackets' | undefined) ?? 'none',
      isrRate: input.isrRate ?? preset?.isrRate ?? null,
      brackets: input.brackets ?? jsonArr<IsrBracket>(preset?.bracketsJson),
    },
    inputs: { paidInvoiceGrossIncomeMxn, paidInvoiceNetIncomeMxn, manualIncomeMxn, refundsMxn, manualExpensesMxn, feesMxn, expenseVatMxn, collectedVatMxn },
    result,
    exportFiles: {
      jsonFilename: 'Director_finance_summary.json',
      csvFilename: 'director_finance_report.csv',
      csv,
    },
  }
}

async function directorMonetizationReportInternal(dateFromRaw?: string, dateToRaw?: string, granularity: 'day' | 'week' | 'month' = 'month') {
  const from = dateOrNull(dateFromRaw) ?? new Date(Date.now() - 90 * 24 * 3600 * 1000)
  const to = dateOrNull(dateToRaw) ?? new Date()

  const [paidInvoices, openInvoices, payments] = await Promise.all([
    prisma.invoice.findMany({
      where: { status: InvoiceStatus.paid, paidAt: { gte: from, lte: to } },
      include: { subscription: { include: { plan: true } }, club: true },
      orderBy: { paidAt: 'asc' },
    }),
    prisma.invoice.findMany({
      where: { status: { in: [InvoiceStatus.draft, InvoiceStatus.issued] } },
      include: { club: true },
    }),
    prisma.payment.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: { invoice: true },
    }),
  ])

  const revenueByPeriodMap = new Map<string, { period: string; totalMxn: number; invoices: number }>()
  for (const invoice of paidInvoices) {
    if (!invoice.paidAt) continue
    const key = bucketKey(invoice.paidAt, granularity)
    const row = revenueByPeriodMap.get(key) ?? { period: key, totalMxn: 0, invoices: 0 }
    row.totalMxn += invoice.totalMxn
    row.invoices += 1
    revenueByPeriodMap.set(key, row)
  }
  const revenueByPeriod = Array.from(revenueByPeriodMap.values()).sort((a, b) => a.period.localeCompare(b.period))

  const revenueByPlanMap = new Map<string, { planId: string; planName: string; totalMxn: number; invoices: number }>()
  for (const invoice of paidInvoices) {
    const planId = invoice.subscription?.plan?.id ?? 'no-plan'
    const planName = invoice.subscription?.plan?.name ?? 'Sin plan'
    const row = revenueByPlanMap.get(planId) ?? { planId, planName, totalMxn: 0, invoices: 0 }
    row.totalMxn += invoice.totalMxn
    row.invoices += 1
    revenueByPlanMap.set(planId, row)
  }
  const revenueByPlan = Array.from(revenueByPlanMap.values()).sort((a, b) => b.totalMxn - a.totalMxn)

  const now = new Date()
  const ar = {
    items: openInvoices,
    summary: {
      openCount: openInvoices.length,
      openTotalMxn: openInvoices.reduce((sum, row) => sum + row.totalMxn, 0),
      pastDueCount: openInvoices.filter((row) => row.dueAt && row.dueAt < now).length,
      pastDueTotalMxn: openInvoices.filter((row) => row.dueAt && row.dueAt < now).reduce((sum, row) => sum + row.totalMxn, 0),
    },
  }

  const fees = {
    totalFeesMxn: payments.reduce((sum, row) => sum + row.feeMxn, 0),
    totalGrossMxn: payments.reduce((sum, row) => sum + row.amountMxn, 0),
    totalRefundsMxn: payments.filter((row) => row.status === PaymentStatus.refunded).reduce((sum, row) => sum + row.amountMxn, 0),
    abnormal: payments
      .filter((row) => row.amountMxn > 0 && row.feeMxn / row.amountMxn >= 0.08)
      .map((row) => ({
        paymentId: row.id,
        invoiceId: row.invoiceId,
        amountMxn: row.amountMxn,
        feeMxn: row.feeMxn,
        feeRate: Number((row.feeMxn / row.amountMxn).toFixed(4)),
      })),
  }

  return {
    filters: { dateFrom: from.toISOString(), dateTo: to.toISOString(), granularity },
    revenueByPeriod,
    revenueByPlan,
    ar,
    fees,
  }
}

export async function registerDirectorMonetizationRoutes(app: FastifyInstance) {
  const providers = buildProviderRegistry(providerFlags())

  app.get('/director/clubs', { preHandler: [app.authenticate, app.authorizeDirector] }, async () =>
    prisma.club.findMany({
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
      select: { id: true, name: true, active: true, capacity: true, managerId: true },
    }),
  )

  app.get('/director/plans', { preHandler: [app.authenticate, app.authorizeDirector] }, async (request) => {
    const query = plansQuerySchema.parse(request.query ?? {})
    const { skip, take } = pageToSkipTake(query.page, query.pageSize)
    const where: Prisma.SubscriptionPlanWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: 'insensitive' } },
              { description: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    }
    const [items, total] = await Promise.all([
      prisma.subscriptionPlan.findMany({ where, orderBy: [{ status: 'asc' }, { createdAt: 'desc' }], skip, take }),
      prisma.subscriptionPlan.count({ where }),
    ])
    return { items: items.map((item) => ({ ...item, entitlements: jsonObj(item.entitlements) })), total, page: query.page, pageSize: query.pageSize }
  })

  app.post('/director/plans', { preHandler: [app.authenticate, app.authorizeDirector] }, async (request, reply) => {
    const body = planSchema.parse(request.body ?? {})
    const created = await prisma.subscriptionPlan.create({
      data: {
        id: randomUUID(),
        name: body.name.trim(),
        description: body.description ?? null,
        billingPeriod: body.billingPeriod,
        priceMxn: body.priceMxn,
        currency: body.currency.toUpperCase(),
        includedEventsPerMonth: body.includedEventsPerMonth ?? null,
        entitlements: toJson(body.entitlements ?? {}),
        overagePricePerEventMxn: body.overagePricePerEventMxn ?? null,
        status: body.status,
      },
    })
    await audit(request.user!.userId, 'plan.create', 'SubscriptionPlan', created.id, null, created)
    reply.code(201)
    return { ...created, entitlements: jsonObj(created.entitlements) }
  })

  app.get('/director/plans/:id', { preHandler: [app.authenticate, app.authorizeDirector] }, async (request) => {
    const { id } = idParamSchema.parse(request.params)
    const row = await requirePlan(app, id)
    return { ...row, entitlements: jsonObj(row.entitlements) }
  })

  app.patch('/director/plans/:id', { preHandler: [app.authenticate, app.authorizeDirector] }, async (request) => {
    const { id } = idParamSchema.parse(request.params)
    const body = planSchema.partial().parse(request.body ?? {})
    const current = await requirePlan(app, id)
    const updated = await prisma.subscriptionPlan.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(body.description !== undefined ? { description: body.description ?? null } : {}),
        ...(body.billingPeriod !== undefined ? { billingPeriod: body.billingPeriod } : {}),
        ...(body.priceMxn !== undefined ? { priceMxn: body.priceMxn } : {}),
        ...(body.currency !== undefined ? { currency: body.currency.toUpperCase() } : {}),
        ...(body.includedEventsPerMonth !== undefined ? { includedEventsPerMonth: body.includedEventsPerMonth ?? null } : {}),
        ...(body.entitlements !== undefined ? { entitlements: toJson(body.entitlements ?? {}) } : {}),
        ...(body.overagePricePerEventMxn !== undefined ? { overagePricePerEventMxn: body.overagePricePerEventMxn ?? null } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
      },
    })
    await audit(request.user!.userId, 'plan.update', 'SubscriptionPlan', id, current, updated)
    return { ...updated, entitlements: jsonObj(updated.entitlements) }
  })

  app.delete('/director/plans/:id', { preHandler: [app.authenticate, app.authorizeDirector] }, async (request, reply) => {
    const { id } = idParamSchema.parse(request.params)
    const current = await requirePlan(app, id)
    await prisma.subscriptionPlan.update({ where: { id }, data: { status: SubscriptionPlanStatus.archived } })
    await audit(request.user!.userId, 'plan.archive', 'SubscriptionPlan', id, current, { ...current, status: SubscriptionPlanStatus.archived })
    reply.code(204).send()
  })

  app.get('/director/subscriptions', { preHandler: [app.authenticate, app.authorizeDirector] }, async (request) => {
    const query = subscriptionsQuerySchema.parse(request.query ?? {})
    const { skip, take } = pageToSkipTake(query.page, query.pageSize)
    const where: Prisma.SubscriptionWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.clubId ? { clubId: query.clubId } : {}),
      ...(query.planId ? { planId: query.planId } : {}),
      ...(query.q
        ? {
            OR: [
              { club: { name: { contains: query.q, mode: 'insensitive' } } },
              { plan: { name: { contains: query.q, mode: 'insensitive' } } },
            ],
          }
        : {}),
    }
    const [items, total] = await Promise.all([
      prisma.subscription.findMany({ where, include: { club: true, plan: true }, orderBy: { updatedAt: 'desc' }, skip, take }),
      prisma.subscription.count({ where }),
    ])
    return { items: items.map((item) => serializeSubscription(item as Awaited<ReturnType<typeof requireSubscription>>)), total, page: query.page, pageSize: query.pageSize }
  })

  app.post('/director/subscriptions', { preHandler: [app.authenticate, app.authorizeDirector] }, async (request, reply) => {
    const body = subscriptionCreateSchema.parse(request.body ?? {})
    const created = await prisma.subscription.create({
      data: {
        id: randomUUID(),
        clubId: body.clubId,
        planId: body.planId,
        status: body.status,
        startAt: new Date(body.startAt),
        currentPeriodStart: new Date(body.currentPeriodStart),
        currentPeriodEnd: new Date(body.currentPeriodEnd),
        cancelAtPeriodEnd: body.cancelAtPeriodEnd,
        trialEndAt: dateOrNull(body.trialEndAt),
        seatsHostsLimit: body.seatsHostsLimit ?? null,
        metadata: toJson(body.metadata ?? {}),
        overrides: toJson(body.overrides ?? {}),
      },
      include: { club: true, plan: true },
    })
    await audit(request.user!.userId, 'subscription.create', 'Subscription', created.id, null, created)
    reply.code(201)
    return serializeSubscription(created as Awaited<ReturnType<typeof requireSubscription>>)
  })

  app.patch('/director/subscriptions/:id', { preHandler: [app.authenticate, app.authorizeDirector] }, async (request) => {
    const { id } = idParamSchema.parse(request.params)
    const body = subscriptionPatchSchema.parse(request.body ?? {})
    const current = await requireSubscription(app, id)
    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        ...(body.planId !== undefined ? { planId: body.planId } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.currentPeriodStart !== undefined ? { currentPeriodStart: new Date(body.currentPeriodStart) } : {}),
        ...(body.currentPeriodEnd !== undefined ? { currentPeriodEnd: new Date(body.currentPeriodEnd) } : {}),
        ...(body.cancelAtPeriodEnd !== undefined ? { cancelAtPeriodEnd: body.cancelAtPeriodEnd } : {}),
        ...(body.trialEndAt !== undefined ? { trialEndAt: dateOrNull(body.trialEndAt) } : {}),
        ...(body.seatsHostsLimit !== undefined ? { seatsHostsLimit: body.seatsHostsLimit ?? null } : {}),
        ...(body.metadata !== undefined ? { metadata: toJson(body.metadata ?? {}) } : {}),
        ...(body.overrides !== undefined ? { overrides: toJson(body.overrides ?? {}) } : {}),
      },
      include: { club: true, plan: true },
    })
    await audit(request.user!.userId, 'subscription.update', 'Subscription', id, current, updated)
    return serializeSubscription(updated as Awaited<ReturnType<typeof requireSubscription>>)
  })

  app.post('/director/invoices', { preHandler: [app.authenticate, app.authorizeDirector] }, async (request, reply) => {
    const body = invoiceCreateSchema.parse(request.body ?? {})
    const items = body.items.map((item) => ({
      description: item.description.trim(),
      qty: item.qty,
      unit_price_mxn: item.unitPriceMxn,
      line_total_mxn: item.qty * item.unitPriceMxn,
    }))
    const totals = calculateInvoiceTotalsFromLineItems(
      body.items.map((item) => ({ description: item.description, qty: item.qty, unitPriceMxn: item.unitPriceMxn })),
      body.taxRate,
    )
    const created = await prisma.invoice.create({
      data: {
        id: randomUUID(),
        clubId: body.clubId,
        subscriptionId: body.subscriptionId ?? null,
        type: body.type,
        subtotalMxn: totals.subtotalMxn,
        taxMxn: totals.taxMxn,
        totalMxn: totals.totalMxn,
        status: body.status,
        issuedAt: dateOrNull(body.issuedAt) ?? (body.status === InvoiceStatus.draft ? null : new Date()),
        dueAt: dateOrNull(body.dueAt),
        paidAt: body.status === InvoiceStatus.paid ? new Date() : null,
        items: toJson(items),
        notes: body.notes ?? null,
      },
    })
    await audit(request.user!.userId, 'invoice.create', 'Invoice', created.id, null, created)
    reply.code(201)
    return created
  })

  app.get('/director/invoices', { preHandler: [app.authenticate, app.authorizeDirector] }, async (request) => {
    const query = invoicesQuerySchema.parse(request.query ?? {})
    const { skip, take } = pageToSkipTake(query.page, query.pageSize)
    const from = dateOrNull(query.dateFrom)
    const to = dateOrNull(query.dateTo)
    const dateFilter = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) }
    const where: Prisma.InvoiceWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.clubId ? { clubId: query.clubId } : {}),
      ...(from || to ? { OR: [{ issuedAt: dateFilter }, { dueAt: dateFilter }, { paidAt: dateFilter }] } : {}),
    }
    const [items, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: { club: true, subscription: { include: { plan: true } }, payments: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.invoice.count({ where }),
    ])
    return {
      items,
      total,
      page: query.page,
      pageSize: query.pageSize,
      summary: {
        pastDueCount: items.filter((item) => item.status !== InvoiceStatus.paid && item.status !== InvoiceStatus.void && item.dueAt && item.dueAt.getTime() < Date.now()).length,
        openCount: items.filter((item) => item.status !== InvoiceStatus.paid && item.status !== InvoiceStatus.void).length,
      },
    }
  })

  app.get('/director/invoices/:id', { preHandler: [app.authenticate, app.authorizeDirector] }, async (request) => {
    const { id } = idParamSchema.parse(request.params)
    return requireInvoice(app, id)
  })

  app.post('/director/invoices/:id/payments', { preHandler: [app.authenticate, app.authorizeDirector] }, async (request) => {
    const { id: invoiceId } = idParamSchema.parse(request.params)
    const body = paymentCreateSchema.parse(request.body ?? {})
    const invoice = await requireInvoice(app, invoiceId)
    const provider = body.provider ?? PaymentProvider.manual

    if (body.providerRef) {
      const duplicate = await prisma.payment.findFirst({ where: { provider, providerRef: body.providerRef } })
      if (duplicate) {
        return { payment: duplicate, invoice: await recalcInvoice(duplicate.invoiceId), idempotent: true }
      }
    }

    const createdAt = dateOrNull(body.createdAt) ?? new Date()
    const payment = await prisma.$transaction(async (tx) => {
      const row = await tx.payment.create({
        data: {
          id: randomUUID(),
          invoiceId: invoice.id,
          clubId: invoice.clubId,
          method: body.method,
          provider,
          providerRef: body.providerRef ?? null,
          amountMxn: body.amountMxn,
          feeMxn: body.feeMxn,
          netMxn: body.amountMxn - body.feeMxn,
          status: body.status,
          createdAt,
          metadata: toJson(body.metadata ?? {}),
        },
      })
      if (row.status === PaymentStatus.succeeded) {
        await tx.ledgerEntry.createMany({
          data: [
            {
              id: randomUUID(),
              clubId: row.clubId,
              type: LedgerEntryType.revenue,
              category: 'invoice_payment',
              amountMxn: row.amountMxn,
              referenceType: 'payment',
              referenceId: row.id,
              occurredAt: createdAt,
            },
            ...(row.feeMxn > 0
              ? [{
                  id: randomUUID(),
                  clubId: row.clubId,
                  type: LedgerEntryType.fee,
                  category: 'payment_fee',
                  amountMxn: -row.feeMxn,
                  referenceType: 'payment',
                  referenceId: row.id,
                  occurredAt: createdAt,
                } satisfies Prisma.LedgerEntryCreateManyInput]
              : []),
          ],
        })
      }
      return row
    })
    const updatedInvoice = await recalcInvoice(invoiceId)
    await audit(request.user!.userId, 'payment.create', 'Payment', payment.id, null, payment)
    return { payment, invoice: updatedInvoice, idempotent: false }
  })

  app.post('/director/payments/:id/refund', { preHandler: [app.authenticate, app.authorizeDirector] }, async (request) => {
    const { id } = idParamSchema.parse(request.params)
    const body = refundSchema.parse(request.body ?? {})
    const current = await requirePayment(app, id)
    if (current.status === PaymentStatus.refunded) throw app.httpErrors.conflict('Pago ya reembolsado')
    const refundAmount = body.amountMxn ?? current.amountMxn
    const refundedAt = new Date()
    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.payment.update({
        where: { id },
        data: {
          status: PaymentStatus.refunded,
          refundedAt,
          metadata: toJson({
            ...jsonObj(current.metadata),
            refund: { amountMxn: refundAmount, reason: body.reason ?? null, refundedAt: refundedAt.toISOString() },
          }),
        },
      })
      await tx.ledgerEntry.create({
        data: {
          id: randomUUID(),
          clubId: row.clubId,
          type: LedgerEntryType.refund,
          category: 'payment_refund',
          amountMxn: -Math.abs(refundAmount),
          referenceType: 'payment',
          referenceId: row.id,
          occurredAt: refundedAt,
          notes: body.reason ?? null,
        },
      })
      return row
    })
    const updatedInvoice = await recalcInvoice(current.invoiceId)
    await audit(request.user!.userId, 'payment.refund', 'Payment', id, current, updated)
    return { payment: updated, invoice: updatedInvoice }
  })

  app.get('/director/ledger-entries', { preHandler: [app.authenticate, app.authorizeDirector] }, async (request) => {
    const query = z.object({
      dateFrom: z.string().datetime().optional(),
      dateTo: z.string().datetime().optional(),
      clubId: z.string().uuid().optional(),
      type: z.enum(LedgerEntryType).optional(),
      page: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(50),
    }).parse(request.query ?? {})
    const { skip, take } = pageToSkipTake(query.page, query.pageSize)
    const from = dateOrNull(query.dateFrom)
    const to = dateOrNull(query.dateTo)
    const where: Prisma.LedgerEntryWhereInput = {
      ...(query.clubId ? { clubId: query.clubId } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(from || to ? { occurredAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
    }
    const [items, total] = await Promise.all([
      prisma.ledgerEntry.findMany({ where, orderBy: { occurredAt: 'desc' }, skip, take }),
      prisma.ledgerEntry.count({ where }),
    ])
    return { items, total, page: query.page, pageSize: query.pageSize }
  })

  app.post('/director/ledger-entries', { preHandler: [app.authenticate, app.authorizeDirector] }, async (request, reply) => {
    const body = ledgerEntrySchema.parse(request.body ?? {})
    const created = await prisma.ledgerEntry.create({
      data: {
        id: randomUUID(),
        clubId: body.clubId ?? null,
        type: body.type,
        category: body.category.trim(),
        amountMxn: body.amountMxn,
        occurredAt: new Date(body.occurredAt),
        notes: body.notes ?? null,
        referenceType: body.referenceType ?? null,
        referenceId: body.referenceId ?? null,
        metadata: toJson(body.metadata ?? {}),
      },
    })
    await audit(request.user!.userId, 'ledger.create', 'LedgerEntry', created.id, null, created)
    reply.code(201)
    return created
  })

  app.patch('/director/ledger-entries/:id', { preHandler: [app.authenticate, app.authorizeDirector] }, async (request) => {
    const { id } = idParamSchema.parse(request.params)
    const body = ledgerEntrySchema.partial().parse(request.body ?? {})
    const current = await prisma.ledgerEntry.findUnique({ where: { id } })
    if (!current) throw app.httpErrors.notFound('Movimiento no encontrado')
    const updated = await prisma.ledgerEntry.update({
      where: { id },
      data: {
        ...(body.clubId !== undefined ? { clubId: body.clubId ?? null } : {}),
        ...(body.type !== undefined ? { type: body.type } : {}),
        ...(body.category !== undefined ? { category: body.category.trim() } : {}),
        ...(body.amountMxn !== undefined ? { amountMxn: body.amountMxn } : {}),
        ...(body.occurredAt !== undefined ? { occurredAt: new Date(body.occurredAt) } : {}),
        ...(body.notes !== undefined ? { notes: body.notes ?? null } : {}),
        ...(body.referenceType !== undefined ? { referenceType: body.referenceType ?? null } : {}),
        ...(body.referenceId !== undefined ? { referenceId: body.referenceId ?? null } : {}),
        ...(body.metadata !== undefined ? { metadata: toJson(body.metadata ?? {}) } : {}),
      },
    })
    await audit(request.user!.userId, 'ledger.update', 'LedgerEntry', id, current, updated)
    return updated
  })

  app.delete('/director/ledger-entries/:id', { preHandler: [app.authenticate, app.authorizeDirector] }, async (request, reply) => {
    const { id } = idParamSchema.parse(request.params)
    const current = await prisma.ledgerEntry.findUnique({ where: { id } })
    if (!current) throw app.httpErrors.notFound('Movimiento no encontrado')
    await prisma.ledgerEntry.delete({ where: { id } })
    await audit(request.user!.userId, 'ledger.delete', 'LedgerEntry', id, current, null)
    reply.code(204).send()
  })

  app.get('/director/finance-presets', { preHandler: [app.authenticate, app.authorizeDirector] }, async (request) => {
    const rows = await prisma.financePreset.findMany({ where: { directorUserId: request.user!.userId }, orderBy: { updatedAt: 'desc' } })
    return { items: rows.map((row) => ({ ...row, bracketsJson: jsonArr(row.bracketsJson), defaultExpenseCategories: jsonArr<string>(row.defaultExpenseCategories) })) }
  })

  app.post('/director/finance-presets', { preHandler: [app.authenticate, app.authorizeDirector] }, async (request, reply) => {
    const body = financePresetSchema.parse(request.body ?? {})
    const created = await prisma.financePreset.create({
      data: {
        id: randomUUID(),
        directorUserId: request.user!.userId,
        name: body.name.trim(),
        vatRate: body.vatRate,
        isrMode: body.isrMode,
        isrRate: body.isrRate ?? null,
        bracketsJson: toJson(body.bracketsJson ?? []),
        defaultExpenseCategories: toJson(body.defaultExpenseCategories ?? []),
        notes: body.notes ?? null,
      },
    })
    await audit(request.user!.userId, 'finance_preset.create', 'FinancePreset', created.id, null, created)
    reply.code(201)
    return { ...created, bracketsJson: jsonArr(created.bracketsJson), defaultExpenseCategories: jsonArr<string>(created.defaultExpenseCategories) }
  })

  app.get('/director/finance-presets/:id', { preHandler: [app.authenticate, app.authorizeDirector] }, async (request) => {
    const { id } = idParamSchema.parse(request.params)
    const row = await prisma.financePreset.findFirst({ where: { id, directorUserId: request.user!.userId } })
    if (!row) throw app.httpErrors.notFound('Preset no encontrado')
    return { ...row, bracketsJson: jsonArr(row.bracketsJson), defaultExpenseCategories: jsonArr<string>(row.defaultExpenseCategories) }
  })

  app.patch('/director/finance-presets/:id', { preHandler: [app.authenticate, app.authorizeDirector] }, async (request) => {
    const { id } = idParamSchema.parse(request.params)
    const body = financePresetSchema.partial().parse(request.body ?? {})
    const current = await prisma.financePreset.findFirst({ where: { id, directorUserId: request.user!.userId } })
    if (!current) throw app.httpErrors.notFound('Preset no encontrado')
    const updated = await prisma.financePreset.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(body.vatRate !== undefined ? { vatRate: body.vatRate } : {}),
        ...(body.isrMode !== undefined ? { isrMode: body.isrMode } : {}),
        ...(body.isrRate !== undefined ? { isrRate: body.isrRate ?? null } : {}),
        ...(body.bracketsJson !== undefined ? { bracketsJson: toJson(body.bracketsJson ?? []) } : {}),
        ...(body.defaultExpenseCategories !== undefined ? { defaultExpenseCategories: toJson(body.defaultExpenseCategories ?? []) } : {}),
        ...(body.notes !== undefined ? { notes: body.notes ?? null } : {}),
      },
    })
    await audit(request.user!.userId, 'finance_preset.update', 'FinancePreset', id, current, updated)
    return { ...updated, bracketsJson: jsonArr(updated.bracketsJson), defaultExpenseCategories: jsonArr<string>(updated.defaultExpenseCategories) }
  })

  app.delete('/director/finance-presets/:id', { preHandler: [app.authenticate, app.authorizeDirector] }, async (request, reply) => {
    const { id } = idParamSchema.parse(request.params)
    const current = await prisma.financePreset.findFirst({ where: { id, directorUserId: request.user!.userId } })
    if (!current) throw app.httpErrors.notFound('Preset no encontrado')
    await prisma.financePreset.delete({ where: { id } })
    await audit(request.user!.userId, 'finance_preset.delete', 'FinancePreset', id, current, null)
    reply.code(204).send()
  })

  app.get('/director/finance/summary', { preHandler: [app.authenticate, app.authorizeDirector] }, async (request) => {
    const query = financeSummaryQuerySchema.parse(request.query ?? {})
    const maybeBrackets = parseBrackets(query.bracketsJson)
    return buildFinanceSummary({
      directorUserId: request.user!.userId,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      incomeMode: query.incomeMode,
      ...(query.presetId ? { presetId: query.presetId } : {}),
      ...(query.vatRate !== undefined ? { vatRate: query.vatRate } : {}),
      ...(query.withholdingRate !== undefined ? { withholdingRate: query.withholdingRate } : {}),
      ...(query.isrMode !== undefined ? { isrMode: query.isrMode } : {}),
      ...(query.isrRate !== undefined ? { isrRate: query.isrRate } : {}),
      ...(maybeBrackets ? { brackets: maybeBrackets } : {}),
    })
  })

  app.get('/director/reports/monetization', { preHandler: [app.authenticate, app.authorizeDirector] }, async (request) => {
    const query = z.object({
      dateFrom: z.string().datetime().optional(),
      dateTo: z.string().datetime().optional(),
      granularity: z.enum(['day', 'week', 'month']).default('month'),
    }).parse(request.query ?? {})
    return directorMonetizationReportInternal(query.dateFrom, query.dateTo, query.granularity)
  })

  app.get('/director/reports/revenue', { preHandler: [app.authenticate, app.authorizeDirector] }, async (request) => {
    const query = z.object({
      dateFrom: z.string().datetime().optional(),
      dateTo: z.string().datetime().optional(),
      granularity: z.enum(['day', 'week', 'month']).default('month'),
    }).parse(request.query ?? {})
    const report = await (async () =>
      directorMonetizationReportInternal(query.dateFrom, query.dateTo, query.granularity))()
    return { filters: report.filters, items: report.revenueByPeriod }
  })

  app.get('/director/reports/revenue-by-plan', { preHandler: [app.authenticate, app.authorizeDirector] }, async (request) => {
    const query = z.object({
      dateFrom: z.string().datetime().optional(),
      dateTo: z.string().datetime().optional(),
    }).parse(request.query ?? {})
    const report = await directorMonetizationReportInternal(query.dateFrom, query.dateTo, 'month')
    return { filters: report.filters, items: report.revenueByPlan }
  })

  app.get('/director/reports/accounts-receivable', { preHandler: [app.authenticate, app.authorizeDirector] }, async (request) => {
    const query = z.object({
      dateFrom: z.string().datetime().optional(),
      dateTo: z.string().datetime().optional(),
    }).parse(request.query ?? {})
    const report = await directorMonetizationReportInternal(query.dateFrom, query.dateTo, 'month')
    return report.ar
  })

  app.get('/director/reports/fees', { preHandler: [app.authenticate, app.authorizeDirector] }, async (request) => {
    const query = z.object({
      dateFrom: z.string().datetime().optional(),
      dateTo: z.string().datetime().optional(),
    }).parse(request.query ?? {})
    const report = await directorMonetizationReportInternal(query.dateFrom, query.dateTo, 'month')
    return report.fees
  })

  app.get('/director/revenue-dashboard', { preHandler: [app.authenticate, app.authorizeDirector] }, async () => {
    const [plans, subscriptions, paidInvoices, openInvoices, payments] = await Promise.all([
      prisma.subscriptionPlan.findMany(),
      prisma.subscription.findMany({ include: { plan: true, club: true } }),
      prisma.invoice.findMany({ where: { status: InvoiceStatus.paid }, include: { subscription: { include: { plan: true } } } }),
      prisma.invoice.findMany({ where: { status: { in: [InvoiceStatus.draft, InvoiceStatus.issued] } } }),
      prisma.payment.findMany(),
    ])
    const now = Date.now()
    const d30 = now - 30 * 24 * 3600 * 1000
    const d90 = now - 90 * 24 * 3600 * 1000
    const activeSubs = subscriptions.filter((s) => s.status === ClubSubscriptionStatus.active || s.status === ClubSubscriptionStatus.trialing)
    const mrrMxn = activeSubs.reduce((sum, s) => {
      if (s.plan.billingPeriod === SubscriptionBillingPeriod.monthly) return sum + s.plan.priceMxn
      if (s.plan.billingPeriod === SubscriptionBillingPeriod.annual) return sum + Math.round(s.plan.priceMxn / 12)
      return sum
    }, 0)
    const arrMxn = mrrMxn * 12
    const revenueLast30DaysMxn = paidInvoices.filter((i) => (i.paidAt?.getTime() ?? 0) >= d30).reduce((sum, i) => sum + i.totalMxn, 0)
    const revenueLast90DaysMxn = paidInvoices.filter((i) => (i.paidAt?.getTime() ?? 0) >= d90).reduce((sum, i) => sum + i.totalMxn, 0)
    const arTotalsMxn = openInvoices.reduce((sum, i) => sum + i.totalMxn, 0)
    const canceledSubscriptions = subscriptions.filter((s) => s.status === ClubSubscriptionStatus.canceled).length
    const churnProxy = subscriptions.length ? Number((canceledSubscriptions / subscriptions.length).toFixed(4)) : 0

    const planMix = plans.map((plan) => ({
      planId: plan.id,
      planName: plan.name,
      clubs: subscriptions.filter((s) => s.planId === plan.id).length,
      revenuePaidMxn: paidInvoices.filter((i) => i.subscription?.plan?.id === plan.id).reduce((sum, i) => sum + i.totalMxn, 0),
    })).sort((a, b) => b.revenuePaidMxn - a.revenuePaidMxn)

    const totalPaymentAmount = payments.reduce((sum, p) => sum + p.amountMxn, 0)
    const totalFeesMxn = payments.reduce((sum, p) => sum + p.feeMxn, 0)
    const avgFeeRate = totalPaymentAmount ? Number((totalFeesMxn / totalPaymentAmount).toFixed(4)) : 0
    const alerts = [
      ...openInvoices.filter((row) => row.dueAt && row.dueAt.getTime() < now).slice(0, 8).map((row) => ({
        id: `pastdue-${row.id}`,
        level: 'warning',
        title: 'Factura vencida',
        description: `${row.id.slice(0, 8)} por ${currencyMxn(row.totalMxn)}`,
      })),
      ...(avgFeeRate >= 0.08 ? [{ id: 'fees-high', level: 'danger', title: 'Comisiones altas', description: `Fee promedio ${(avgFeeRate * 100).toFixed(2)}%` }] : []),
    ]
    return { kpis: { mrrMxn, arrMxn, revenueLast30DaysMxn, revenueLast90DaysMxn, arTotalsMxn, churnProxy, canceledSubscriptions }, planMix, feeSummary: { totalFeesMxn, avgFeeRate }, alerts }
  })

  // Placeholder webhook structure; provider signature verification remains TODO until secrets/SDKs are configured.
  app.post('/payments/webhook/:provider', async (request) => {
    const { provider } = providerWebhookParamSchema.parse(request.params)
    const adapter = providers.get(provider)
    if (!adapter) throw app.httpErrors.notFound('Provider no soportado')
    const parsed = adapter.parseWebhookPayload(request.body)
    if (!parsed.accepted) throw app.httpErrors.badRequest(parsed.message ?? 'Webhook invalido')

    let payment = parsed.providerRef ? await prisma.payment.findFirst({ where: { provider, providerRef: parsed.providerRef } }) : null
    if (!payment && parsed.invoiceId && parsed.clubId && typeof parsed.amountMxn === 'number') {
      payment = await prisma.payment.create({
        data: {
          id: randomUUID(),
          invoiceId: parsed.invoiceId,
          clubId: parsed.clubId,
          method: PaymentMethod.provider,
          provider,
          providerRef: parsed.providerRef ?? null,
          amountMxn: parsed.amountMxn,
          feeMxn: Math.max(parsed.feeMxn ?? 0, 0),
          netMxn: parsed.amountMxn - Math.max(parsed.feeMxn ?? 0, 0),
          status: parsed.status ?? PaymentStatus.pending,
          metadata: toJson(parsed.metadata ?? {}),
        },
      })
      if (payment.status === PaymentStatus.succeeded) {
        await prisma.ledgerEntry.createMany({
          data: [
            {
              id: randomUUID(),
              clubId: payment.clubId,
              type: LedgerEntryType.revenue,
              category: 'invoice_payment',
              amountMxn: payment.amountMxn,
              referenceType: 'payment',
              referenceId: payment.id,
              occurredAt: payment.createdAt,
            },
            ...(payment.feeMxn > 0
              ? [{
                  id: randomUUID(),
                  clubId: payment.clubId,
                  type: LedgerEntryType.fee,
                  category: 'payment_fee',
                  amountMxn: -payment.feeMxn,
                  referenceType: 'payment',
                  referenceId: payment.id,
                  occurredAt: payment.createdAt,
                } satisfies Prisma.LedgerEntryCreateManyInput]
              : []),
          ],
        })
      }
    }
    const invoice = payment ? await recalcInvoice(payment.invoiceId) : null
    return { ok: true, provider, adapterEnabled: adapter.enabled, message: parsed.message ?? null, paymentId: payment?.id ?? null, invoiceId: invoice?.id ?? parsed.invoiceId ?? null }
  })
}
