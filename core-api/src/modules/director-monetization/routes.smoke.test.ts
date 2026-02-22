import request from 'supertest'
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest'
import { randomUUID } from 'crypto'
import { UserRole } from '@prisma/client'
import { buildServer } from '../../server'
import { prisma } from '../../lib/prisma'
import { hashPassword } from '../../lib/password'

describe.sequential('Director monetization smoke flow', () => {
  let app: Awaited<ReturnType<typeof buildServer>>
  const createdUserIds = new Set<string>()
  const createdClubIds = new Set<string>()
  const createdPlanIds = new Set<string>()
  const createdSubscriptionIds = new Set<string>()
  const createdInvoiceIds = new Set<string>()
  const createdPaymentIds = new Set<string>()
  const createdLedgerIds = new Set<string>()
  const createdAuditIds = new Set<string>()

  beforeAll(async () => {
    app = await buildServer()
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  afterEach(async () => {
    if (createdAuditIds.size) {
      await prisma.directorAuditLog.deleteMany({ where: { id: { in: Array.from(createdAuditIds) } } })
      createdAuditIds.clear()
    }
    if (createdLedgerIds.size) {
      await prisma.ledgerEntry.deleteMany({ where: { id: { in: Array.from(createdLedgerIds) } } })
      createdLedgerIds.clear()
    }
    if (createdPaymentIds.size) {
      await prisma.payment.deleteMany({ where: { id: { in: Array.from(createdPaymentIds) } } })
      createdPaymentIds.clear()
    }
    if (createdInvoiceIds.size) {
      await prisma.invoice.deleteMany({ where: { id: { in: Array.from(createdInvoiceIds) } } })
      createdInvoiceIds.clear()
    }
    if (createdSubscriptionIds.size) {
      await prisma.subscription.deleteMany({ where: { id: { in: Array.from(createdSubscriptionIds) } } })
      createdSubscriptionIds.clear()
    }
    if (createdPlanIds.size) {
      await prisma.subscriptionPlan.deleteMany({ where: { id: { in: Array.from(createdPlanIds) } } })
      createdPlanIds.clear()
    }
    if (createdClubIds.size) {
      await prisma.club.deleteMany({ where: { id: { in: Array.from(createdClubIds) } } })
      createdClubIds.clear()
    }
    if (createdUserIds.size) {
      await prisma.managerSetting.deleteMany({ where: { managerId: { in: Array.from(createdUserIds) } } })
      await prisma.financePreset.deleteMany({ where: { directorUserId: { in: Array.from(createdUserIds) } } })
      await prisma.user.deleteMany({ where: { id: { in: Array.from(createdUserIds) } } })
      createdUserIds.clear()
    }
  })

  async function createUser(role: UserRole, prefix: string) {
    const id = randomUUID()
    const username = `${prefix}_${id.slice(0, 6)}`
    const password = `Pass-${id.slice(0, 5)}`
    await prisma.user.create({
      data: {
        id,
        name: `${prefix} ${id.slice(0, 4)}`,
        username,
        password: await hashPassword(password),
        role,
      },
    })
    createdUserIds.add(id)
    return { id, username, password }
  }

  async function login(username: string, password: string) {
    const response = await request(app.server).post('/auth/login').send({ username, password })
    expect(response.status).toBe(200)
    return response.body.token as string
  }

  test('create plan -> assign subscription -> generate invoice -> record manual payment -> finance summary updates', async () => {
    const director = await createUser(UserRole.DIRECTOR, 'director')
    const manager = await createUser(UserRole.MANAGER, 'manager')
    await prisma.managerSetting.create({
      data: { id: randomUUID(), managerId: manager.id, otherLabel: 'Otro' },
    })

    const club = await prisma.club.create({
      data: { id: randomUUID(), managerId: manager.id, name: 'Club Smoke', capacity: 500 },
    })
    createdClubIds.add(club.id)

    const token = await login(director.username, director.password)

    const planResponse = await request(app.server)
      .post('/director/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Smoke Plan',
        billingPeriod: 'monthly',
        priceMxn: 100000,
        currency: 'MXN',
        includedEventsPerMonth: 4,
        entitlements: { events_per_month: 4 },
        overagePricePerEventMxn: 25000,
        status: 'active',
      })

    expect(planResponse.status).toBe(201)
    const planId = planResponse.body.id as string
    createdPlanIds.add(planId)

    const now = new Date()
    const next = new Date(now.getTime() + 30 * 24 * 3600 * 1000)
    const subscriptionResponse = await request(app.server)
      .post('/director/subscriptions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clubId: club.id,
        planId,
        status: 'active',
        startAt: now.toISOString(),
        currentPeriodStart: now.toISOString(),
        currentPeriodEnd: next.toISOString(),
        cancelAtPeriodEnd: false,
        overrides: { hosts_limit: 3 },
      })

    expect(subscriptionResponse.status).toBe(201)
    expect(subscriptionResponse.body.effectiveEntitlements.events_per_month).toBe(4)
    const subscriptionId = subscriptionResponse.body.id as string
    createdSubscriptionIds.add(subscriptionId)

    const invoiceResponse = await request(app.server)
      .post('/director/invoices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clubId: club.id,
        subscriptionId,
        type: 'subscription',
        taxRate: 0.16,
        items: [{ description: 'Suscripcion mensual', qty: 1, unitPriceMxn: 100000 }],
        status: 'issued',
      })

    expect(invoiceResponse.status).toBe(201)
    expect(invoiceResponse.body.totalMxn).toBe(116000)
    const invoiceId = invoiceResponse.body.id as string
    createdInvoiceIds.add(invoiceId)

    const paymentResponse = await request(app.server)
      .post(`/director/invoices/${invoiceId}/payments`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        method: 'transfer',
        amountMxn: 116000,
        feeMxn: 1000,
        provider: 'manual',
        providerRef: `smoke-${invoiceId.slice(0, 8)}`,
      })

    expect(paymentResponse.status).toBe(200)
    expect(paymentResponse.body.idempotent).toBe(false)
    expect(paymentResponse.body.payment.status).toBe('succeeded')
    expect(paymentResponse.body.invoice.status).toBe('paid')
    createdPaymentIds.add(paymentResponse.body.payment.id as string)

    const createdLedger = await prisma.ledgerEntry.findMany({
      where: { referenceId: paymentResponse.body.payment.id as string },
      select: { id: true, type: true },
    })
    for (const row of createdLedger) createdLedgerIds.add(row.id)
    expect(createdLedger.some((row) => row.type === 'revenue')).toBe(true)
    expect(createdLedger.some((row) => row.type === 'fee')).toBe(true)

    const summaryResponse = await request(app.server)
      .get('/director/finance/summary')
      .set('Authorization', `Bearer ${token}`)
      .query({
        dateFrom: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
        dateTo: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString(),
        incomeMode: 'gross',
        vatRate: 0.16,
        isrMode: 'simple_rate',
        isrRate: 0.1,
      })

    expect(summaryResponse.status).toBe(200)
    expect(summaryResponse.body.result.grossIncomeMxn).toBeGreaterThanOrEqual(116000)
    expect(summaryResponse.body.result.vatCollectedMxn).toBeGreaterThanOrEqual(16000)
    expect(summaryResponse.body.exportFiles.csvFilename).toBe('director_finance_report.csv')

    const auditRows = await prisma.directorAuditLog.findMany({
      where: { actorUserId: director.id },
      select: { id: true, action: true },
    })
    for (const row of auditRows) createdAuditIds.add(row.id)
    expect(auditRows.some((row) => row.action === 'plan.create')).toBe(true)
    expect(auditRows.some((row) => row.action === 'subscription.create')).toBe(true)
    expect(auditRows.some((row) => row.action === 'invoice.create')).toBe(true)
    expect(auditRows.some((row) => row.action === 'payment.create')).toBe(true)
  })
})
