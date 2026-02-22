import { appEnv } from './env'

type UserRole = 'MANAGER' | 'RP' | 'SCANNER' | 'DIRECTOR'
type GuestType = 'GENERAL' | 'VIP' | 'OTHER'
type DeliveryMethod = 'WHATSAPP' | 'DOWNLOAD'

type Session = {
  token: string
  userId: string
  role: UserRole
}

type Club = { id: string; name: string; capacity: number; active: boolean }
type Rp = { id: string; active: boolean; user: { id: string; name: string; username: string } }
type Scanner = { id: string; active: boolean; user: { id: string; name: string; username: string }; lastScanAt: string | null }
type ManagerSubscriptionPlan = 'BASIC' | 'PRO' | 'ENTERPRISE'
type ManagerSubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED'
type ManagerSubscriptionType = 'PER_EVENT' | 'RECURRING'
type ManagerPaymentStatus = 'PAID' | 'DUE_SOON' | 'PENDING' | 'PAST_DUE'
type ManagerPaymentRecordStatus = 'PAID' | 'PENDING' | 'PAST_DUE' | 'VOID'
type BillingCycle = 'MONTHLY' | 'ANNUAL'
type ManagerSubscription =
  | {
      type: 'RECURRING'
      plan: ManagerSubscriptionPlan
      status: ManagerSubscriptionStatus
      billingCycle: BillingCycle
      recurringAmount: number
      startsAt: string
      renewsAt: string | null
    }
  | {
      type: 'PER_EVENT'
      plan: ManagerSubscriptionPlan
      status: ManagerSubscriptionStatus
      perEventAmount: number
      startsAt: string
      renewsAt: string | null
    }
type ManagerAccount = {
  id: string
  active: boolean
  user: { id: string; name: string; username: string; email: string }
  clubIds: string[]
  subscription: ManagerSubscription
  billing: {
    paymentStatus: ManagerPaymentStatus
    nextDueAt: string | null
    lastPaidAt: string | null
    history: Array<{
      id: string
      concept: string
      amount: number
      currency: 'USD'
      status: ManagerPaymentRecordStatus
      issuedAt: string
      dueAt: string | null
      paidAt: string | null
    }>
  }
}
type Event = {
  id: string
  name: string
  startsAt: string
  endsAt: string
  active: boolean
  clubId: string
  templateImageUrl: string | null
  qrPositionX: number | null
  qrPositionY: number | null
  qrSize: number | null
}
type Assignment = { id: string; eventId: string; rpId: string; limitAccesses: number | null }
type RpGroup = { id: string; name: string; memberIds: string[] }
type Ticket = {
  id: string
  eventId: string
  rpId: string
  guestType: GuestType
  note: string | null
  createdAt: string
  status: 'PENDING' | 'SCANNED'
  scannedAt: string | null
  scannerName: string | null
  deliveryMethod: DeliveryMethod | null
  deliveryAt: string | null
}
type LandingAppointment = {
  id: string
  createdAt: string
  fullName: string
  phone: string
  clubInterest: string
  eventType: string
  preferredDate: string | null
  status: 'NEW' | 'CONTACTED' | 'BOOKED' | 'CANCELLED'
  source: 'LANDING'
}

type MonetizationPlanStatus = 'active' | 'archived'
type MonetizationBillingPeriod = 'monthly' | 'annual' | 'one_time'
type MonetizationSubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'paused'
type MonetizationInvoiceType = 'subscription' | 'topup' | 'manual_adjustment'
type MonetizationInvoiceStatus = 'draft' | 'issued' | 'paid' | 'void'
type MonetizationPaymentMethod = 'cash' | 'transfer' | 'card' | 'provider'
type MonetizationPaymentProvider = 'manual' | 'stripe' | 'conekta' | 'mercadopago' | 'openpay'
type MonetizationPaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded'
type MonetizationLedgerType = 'revenue' | 'expense' | 'tax' | 'refund' | 'fee' | 'adjustment'
type MonetizationIsrMode = 'none' | 'simple_rate' | 'brackets'

type MonetizationPlan = {
  id: string
  name: string
  description: string | null
  billingPeriod: MonetizationBillingPeriod
  priceMxn: number
  currency: 'MXN'
  includedEventsPerMonth: number | null
  entitlements: Record<string, unknown>
  overagePricePerEventMxn: number | null
  status: MonetizationPlanStatus
  createdAt: string
  updatedAt: string
}

type MonetizationSubscription = {
  id: string
  clubId: string
  planId: string
  status: MonetizationSubscriptionStatus
  startAt: string
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  trialEndAt: string | null
  seatsHostsLimit: number | null
  metadata: Record<string, unknown>
  overrides: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

type MonetizationInvoiceItem = {
  description: string
  qty: number
  unit_price_mxn: number
  line_total_mxn: number
}

type MonetizationInvoice = {
  id: string
  clubId: string
  subscriptionId: string | null
  type: MonetizationInvoiceType
  subtotalMxn: number
  taxMxn: number
  totalMxn: number
  status: MonetizationInvoiceStatus
  issuedAt: string | null
  dueAt: string | null
  paidAt: string | null
  items: MonetizationInvoiceItem[]
  notes: string | null
  createdAt: string
  updatedAt: string
}

type MonetizationPayment = {
  id: string
  invoiceId: string
  clubId: string
  method: MonetizationPaymentMethod
  provider: MonetizationPaymentProvider | null
  providerRef: string | null
  amountMxn: number
  feeMxn: number
  netMxn: number
  status: MonetizationPaymentStatus
  createdAt: string
  updatedAt: string
  refundedAt?: string | null
  metadata?: Record<string, unknown> | null
}

type MonetizationLedgerEntry = {
  id: string
  clubId: string | null
  type: MonetizationLedgerType
  category: string
  amountMxn: number
  referenceType: string | null
  referenceId: string | null
  occurredAt: string
  notes: string | null
  metadata: Record<string, unknown>
  createdAt: string
}

type MonetizationFinancePreset = {
  id: string
  directorUserId: string
  name: string
  vatRate: number
  isrMode: MonetizationIsrMode
  isrRate: number | null
  bracketsJson: Array<{ lowerLimitMxn?: number; upToMxn?: number | null; rate: number; fixedFeeMxn?: number }>
  defaultExpenseCategories: string[]
  notes: string | null
  createdAt: string
  updatedAt: string
}

type State = {
  clubs: Club[]
  managers: ManagerAccount[]
  rps: Rp[]
  scanners: Scanner[]
  events: Event[]
  assignments: Assignment[]
  rpGroups: RpGroup[]
  tickets: Ticket[]
  landingAppointments: LandingAppointment[]
  otherLabel: string
  seq: Record<string, number>
}

const SESSION_KEY = 'monopass_session'
let installed = false

function enabled() {
  return import.meta.env.VITE_APP_MOCK === 'true'
}

function isoOffset(hours: number) {
  return new Date(Date.now() + hours * 3_600_000).toISOString()
}

const state: State = {
  clubs: [
    { id: 'club-01', name: 'Club Atlas', capacity: 420, active: true },
    { id: 'club-02', name: 'Neon District', capacity: 280, active: true },
    { id: 'club-03', name: 'Sotano 9', capacity: 180, active: false },
  ],
  managers: [
    {
      id: 'mgr-01',
      active: true,
      user: {
        id: 'usr-mgr-01',
        name: 'Luciano Vega',
        username: 'manager.atlas',
        email: 'luciano@atlasclub.test',
      },
      clubIds: ['club-01'],
      subscription: {
        type: 'RECURRING',
        plan: 'PRO',
        status: 'ACTIVE',
        billingCycle: 'MONTHLY',
        recurringAmount: 149,
        startsAt: isoOffset(-24 * 40),
        renewsAt: isoOffset(24 * 20),
      },
      billing: {
        paymentStatus: 'PAID',
        nextDueAt: isoOffset(24 * 20),
        lastPaidAt: isoOffset(-24 * 10),
        history: [
          {
            id: 'pay-001',
            concept: 'Suscripcion PRO - Agosto',
            amount: 149,
            currency: 'USD',
            status: 'PAID',
            issuedAt: isoOffset(-24 * 28),
            dueAt: isoOffset(-24 * 24),
            paidAt: isoOffset(-24 * 24),
          },
          {
            id: 'pay-002',
            concept: 'Suscripcion PRO - Septiembre',
            amount: 149,
            currency: 'USD',
            status: 'PAID',
            issuedAt: isoOffset(-24 * 12),
            dueAt: isoOffset(-24 * 8),
            paidAt: isoOffset(-24 * 10),
          },
        ],
      },
    },
    {
      id: 'mgr-02',
      active: true,
      user: {
        id: 'usr-mgr-02',
        name: 'Mara Costa',
        username: 'manager.neon',
        email: 'mara@neondistrict.test',
      },
      clubIds: ['club-02'],
      subscription: {
        plan: 'BASIC',
        type: 'PER_EVENT',
        status: 'ACTIVE',
        perEventAmount: 39,
        startsAt: isoOffset(-24 * 75),
        renewsAt: isoOffset(-24 * 2),
      },
      billing: {
        paymentStatus: 'PENDING',
        nextDueAt: isoOffset(24 * 3),
        lastPaidAt: isoOffset(-24 * 18),
        history: [
          {
            id: 'pay-003',
            concept: 'Evento Techno Friday',
            amount: 39,
            currency: 'USD',
            status: 'PAID',
            issuedAt: isoOffset(-24 * 20),
            dueAt: isoOffset(-24 * 18),
            paidAt: isoOffset(-24 * 18),
          },
          {
            id: 'pay-004',
            concept: 'Evento Noche Retro',
            amount: 39,
            currency: 'USD',
            status: 'PENDING',
            issuedAt: isoOffset(-24 * 1),
            dueAt: isoOffset(24 * 3),
            paidAt: null,
          },
        ],
      },
    },
    {
      id: 'mgr-03',
      active: false,
      user: {
        id: 'usr-mgr-03',
        name: 'Elena Rios',
        username: 'manager.sotano',
        email: 'elena@sotano9.test',
      },
      clubIds: ['club-03'],
      subscription: {
        type: 'RECURRING',
        plan: 'BASIC',
        status: 'CANCELED',
        billingCycle: 'MONTHLY',
        recurringAmount: 79,
        startsAt: isoOffset(-24 * 140),
        renewsAt: null,
      },
      billing: {
        paymentStatus: 'PAST_DUE',
        nextDueAt: isoOffset(-24 * 16),
        lastPaidAt: isoOffset(-24 * 48),
        history: [
          {
            id: 'pay-005',
            concept: 'Suscripcion BASIC - Junio',
            amount: 79,
            currency: 'USD',
            status: 'PAID',
            issuedAt: isoOffset(-24 * 60),
            dueAt: isoOffset(-24 * 56),
            paidAt: isoOffset(-24 * 48),
          },
          {
            id: 'pay-006',
            concept: 'Suscripcion BASIC - Julio',
            amount: 79,
            currency: 'USD',
            status: 'PAST_DUE',
            issuedAt: isoOffset(-24 * 32),
            dueAt: isoOffset(-24 * 28),
            paidAt: null,
          },
        ],
      },
    },
  ],
  rps: [
    { id: 'rp-01', active: true, user: { id: 'usr-rp-01', name: 'Sofia Ramirez', username: 'rp.sofia' } },
    { id: 'rp-02', active: true, user: { id: 'usr-rp-02', name: 'Diego Luna', username: 'rp.diego' } },
    { id: 'rp-03', active: false, user: { id: 'usr-rp-03', name: 'Valen Cruz', username: 'rp.valen' } },
  ],
  scanners: [
    { id: 'scanner-01', active: true, user: { id: 'usr-sc-01', name: 'Axel Cruz', username: 'scanner.axel' }, lastScanAt: isoOffset(-1.2) },
    { id: 'scanner-02', active: true, user: { id: 'usr-sc-02', name: 'Mia Lopez', username: 'scanner.mia' }, lastScanAt: isoOffset(-0.6) },
    { id: 'scanner-03', active: false, user: { id: 'usr-sc-03', name: 'Gael Rios', username: 'scanner.gael' }, lastScanAt: null },
  ],
  events: [
    {
      id: 'evt-01',
      name: 'Noche Retro',
      startsAt: isoOffset(-5),
      endsAt: isoOffset(6),
      active: true,
      clubId: 'club-01',
      templateImageUrl: null,
      qrPositionX: 0.5,
      qrPositionY: 0.5,
      qrSize: 0.35,
    },
    {
      id: 'evt-02',
      name: 'Techno Friday',
      startsAt: isoOffset(18),
      endsAt: isoOffset(30),
      active: true,
      clubId: 'club-02',
      templateImageUrl: null,
      qrPositionX: 0.5,
      qrPositionY: 0.5,
      qrSize: 0.35,
    },
    {
      id: 'evt-03',
      name: 'After Sunday',
      startsAt: isoOffset(-36),
      endsAt: isoOffset(-24),
      active: false,
      clubId: 'club-02',
      templateImageUrl: null,
      qrPositionX: 0.5,
      qrPositionY: 0.5,
      qrSize: 0.35,
    },
  ],
  assignments: [
    { id: 'asg-01', eventId: 'evt-01', rpId: 'rp-01', limitAccesses: 80 },
    { id: 'asg-02', eventId: 'evt-01', rpId: 'rp-02', limitAccesses: 55 },
    { id: 'asg-03', eventId: 'evt-02', rpId: 'rp-01', limitAccesses: 35 },
    { id: 'asg-04', eventId: 'evt-02', rpId: 'rp-02', limitAccesses: null },
    { id: 'asg-05', eventId: 'evt-03', rpId: 'rp-01', limitAccesses: 28 },
  ],
  rpGroups: [
    { id: 'rpg-01', name: 'Top Sellers', memberIds: ['rp-01', 'rp-02'] },
    { id: 'rpg-02', name: 'Backup Crew', memberIds: ['rp-03'] },
  ],
  tickets: [
    {
      id: 'tkt-1001',
      eventId: 'evt-01',
      rpId: 'rp-01',
      guestType: 'VIP',
      note: 'Mesa 8',
      createdAt: isoOffset(-3.8),
      status: 'SCANNED',
      scannedAt: isoOffset(-2.8),
      scannerName: 'Axel Cruz',
      deliveryMethod: 'WHATSAPP',
      deliveryAt: isoOffset(-3.7),
    },
    {
      id: 'tkt-1002',
      eventId: 'evt-01',
      rpId: 'rp-01',
      guestType: 'GENERAL',
      note: null,
      createdAt: isoOffset(-3.2),
      status: 'SCANNED',
      scannedAt: isoOffset(-2.1),
      scannerName: 'Mia Lopez',
      deliveryMethod: 'WHATSAPP',
      deliveryAt: isoOffset(-3.1),
    },
    {
      id: 'tkt-1003',
      eventId: 'evt-01',
      rpId: 'rp-02',
      guestType: 'OTHER',
      note: 'Cumpleanera',
      createdAt: isoOffset(-2.8),
      status: 'PENDING',
      scannedAt: null,
      scannerName: null,
      deliveryMethod: null,
      deliveryAt: null,
    },
    {
      id: 'tkt-1004',
      eventId: 'evt-02',
      rpId: 'rp-02',
      guestType: 'VIP',
      note: null,
      createdAt: isoOffset(-0.8),
      status: 'PENDING',
      scannedAt: null,
      scannerName: null,
      deliveryMethod: 'DOWNLOAD',
      deliveryAt: isoOffset(-0.7),
    },
    {
      id: 'tkt-1005',
      eventId: 'evt-03',
      rpId: 'rp-01',
      guestType: 'GENERAL',
      note: null,
      createdAt: isoOffset(-30),
      status: 'SCANNED',
      scannedAt: isoOffset(-29),
      scannerName: 'Axel Cruz',
      deliveryMethod: 'WHATSAPP',
      deliveryAt: isoOffset(-29.6),
    },
  ],
  landingAppointments: [
    {
      id: 'lead-001',
      createdAt: isoOffset(-3),
      fullName: 'Camila Torres',
      phone: '+54 11 5123 7788',
      clubInterest: 'Club Atlas',
      eventType: 'Cumpleanos',
      preferredDate: isoOffset(72),
      status: 'NEW',
      source: 'LANDING',
    },
    {
      id: 'lead-002',
      createdAt: isoOffset(-9),
      fullName: 'Juan Perez',
      phone: '+54 11 4001 2233',
      clubInterest: 'Neon District',
      eventType: 'Mesa VIP',
      preferredDate: isoOffset(120),
      status: 'CONTACTED',
      source: 'LANDING',
    },
    {
      id: 'lead-003',
      createdAt: isoOffset(-28),
      fullName: 'Sofia Herrera',
      phone: '+54 11 6770 1122',
      clubInterest: 'Club Atlas',
      eventType: 'Evento corporativo',
      preferredDate: isoOffset(240),
      status: 'BOOKED',
      source: 'LANDING',
    },
    {
      id: 'lead-004',
      createdAt: isoOffset(-51),
      fullName: 'Mateo Ruiz',
      phone: '+54 11 3661 9911',
      clubInterest: 'Neon District',
      eventType: 'Reservacion general',
      preferredDate: null,
      status: 'CONTACTED',
      source: 'LANDING',
    },
    {
      id: 'lead-005',
      createdAt: isoOffset(-88),
      fullName: 'Valentina Gomez',
      phone: '+54 11 4332 1100',
      clubInterest: 'Sotano 9',
      eventType: 'Fiesta privada',
      preferredDate: isoOffset(168),
      status: 'CANCELLED',
      source: 'LANDING',
    },
    {
      id: 'lead-006',
      createdAt: isoOffset(-130),
      fullName: 'Luca Fernandez',
      phone: '+54 11 5222 9087',
      clubInterest: 'Club Atlas',
      eventType: 'Consulta paquetes',
      preferredDate: isoOffset(336),
      status: 'NEW',
      source: 'LANDING',
    },
  ],
  otherLabel: 'CORTESIA',
  seq: { club: 4, manager: 4, rp: 4, scanner: 4, event: 4, assignment: 6, rpGroup: 3, ticket: 1006 },
}

type MonetizationStore = {
  plans: MonetizationPlan[]
  subscriptions: MonetizationSubscription[]
  invoices: MonetizationInvoice[]
  payments: MonetizationPayment[]
  ledgerEntries: MonetizationLedgerEntry[]
  financePresets: MonetizationFinancePreset[]
  seq: {
    plan: number
    subscription: number
    invoice: number
    payment: number
    ledger: number
    preset: number
  }
}

const monetization: MonetizationStore = {
  plans: [
    {
      id: 'plan-01',
      name: 'Pro Mensual MX',
      description: 'Plan base director demo',
      billingPeriod: 'monthly',
      priceMxn: 149900,
      currency: 'MXN',
      includedEventsPerMonth: 8,
      entitlements: { events_per_month: 8, rps: 20, scanners: 10 },
      overagePricePerEventMxn: 19900,
      status: 'active',
      createdAt: isoOffset(-24 * 90),
      updatedAt: isoOffset(-24 * 10),
    },
    {
      id: 'plan-02',
      name: 'Enterprise Anual MX',
      description: 'Plan anual demo',
      billingPeriod: 'annual',
      priceMxn: 1499900,
      currency: 'MXN',
      includedEventsPerMonth: 20,
      entitlements: { events_per_month: 20, rps: 60, scanners: 40 },
      overagePricePerEventMxn: 15000,
      status: 'active',
      createdAt: isoOffset(-24 * 80),
      updatedAt: isoOffset(-24 * 4),
    },
  ],
  subscriptions: [
    {
      id: 'sub-01',
      clubId: 'club-01',
      planId: 'plan-01',
      status: 'active',
      startAt: isoOffset(-24 * 60),
      currentPeriodStart: isoOffset(-24 * 3),
      currentPeriodEnd: isoOffset(24 * 27),
      cancelAtPeriodEnd: false,
      trialEndAt: null,
      seatsHostsLimit: 5,
      metadata: { source: 'mock-seed' },
      overrides: { hosts_limit: 5 },
      createdAt: isoOffset(-24 * 60),
      updatedAt: isoOffset(-24 * 2),
    },
    {
      id: 'sub-02',
      clubId: 'club-02',
      planId: 'plan-02',
      status: 'past_due',
      startAt: isoOffset(-24 * 120),
      currentPeriodStart: isoOffset(-24 * 40),
      currentPeriodEnd: isoOffset(-24 * 5),
      cancelAtPeriodEnd: true,
      trialEndAt: null,
      seatsHostsLimit: 12,
      metadata: {},
      overrides: {},
      createdAt: isoOffset(-24 * 120),
      updatedAt: isoOffset(-24 * 1),
    },
  ],
  invoices: [],
  payments: [],
  ledgerEntries: [],
  financePresets: [
    {
      id: 'fp-01',
      directorUserId: 'director.demo',
      name: 'MX Default',
      vatRate: 0.16,
      isrMode: 'simple_rate',
      isrRate: 0.1,
      bracketsJson: [],
      defaultExpenseCategories: ['infra', 'marketing', 'staff'],
      notes: 'Preset mock',
      createdAt: isoOffset(-24 * 20),
      updatedAt: isoOffset(-24 * 2),
    },
  ],
  seq: { plan: 3, subscription: 3, invoice: 1, payment: 1, ledger: 1, preset: 2 },
}

function nextMonetizationId(key: keyof MonetizationStore['seq'], prefix: string) {
  const n = monetization.seq[key]
  monetization.seq[key] = n + 1
  return `${prefix}${String(n).padStart(2, '0')}`
}

function deepMergeObjects(base: Record<string, unknown>, override: Record<string, unknown>) {
  const result: Record<string, unknown> = { ...base }
  for (const [key, value] of Object.entries(override)) {
    const current = result[key]
    if (
      current &&
      typeof current === 'object' &&
      !Array.isArray(current) &&
      value &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      result[key] = deepMergeObjects(current as Record<string, unknown>, value as Record<string, unknown>)
    } else {
      result[key] = value
    }
  }
  return result
}

function managerIdForClub(clubId: string) {
  const manager = state.managers.find((item) => item.clubIds.includes(clubId))
  return manager?.id ?? 'manager-unknown'
}

function directorClubDto(club: Club) {
  return { ...club, managerId: managerIdForClub(club.id) }
}

function monetizationPlanById(planId: string) {
  return monetization.plans.find((plan) => plan.id === planId) ?? null
}

function monetizationSubscriptionById(id: string) {
  return monetization.subscriptions.find((sub) => sub.id === id) ?? null
}

function monetizationInvoiceById(id: string) {
  return monetization.invoices.find((invoice) => invoice.id === id) ?? null
}

function monetizationPaymentById(id: string) {
  return monetization.payments.find((payment) => payment.id === id) ?? null
}

function enrichSubscription(sub: MonetizationSubscription) {
  const club = state.clubs.find((item) => item.id === sub.clubId)
  const plan = monetizationPlanById(sub.planId)
  const effectiveEntitlements = deepMergeObjects(plan?.entitlements ?? {}, sub.overrides ?? {})
  return {
    ...sub,
    club: club ? directorClubDto(club) : { id: sub.clubId, name: 'Club', capacity: 0, active: true, managerId: 'manager-unknown' },
    plan: plan ?? {
      id: sub.planId,
      name: 'Plan',
      description: null,
      billingPeriod: 'monthly' as const,
      priceMxn: 0,
      currency: 'MXN' as const,
      includedEventsPerMonth: null,
      entitlements: {},
      overagePricePerEventMxn: null,
      status: 'archived' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    effectiveEntitlements,
  }
}

function enrichInvoice(invoice: MonetizationInvoice) {
  const club = state.clubs.find((item) => item.id === invoice.clubId)
  const subscription = invoice.subscriptionId ? monetizationSubscriptionById(invoice.subscriptionId) : null
  const payments = monetization.payments.filter((payment) => payment.invoiceId === invoice.id)
  return {
    ...invoice,
    club: club ? directorClubDto(club) : undefined,
    subscription: subscription ? enrichSubscription(subscription) : null,
    payments,
  }
}

function recalcInvoiceStatusMock(invoiceId: string) {
  const invoice = monetizationInvoiceById(invoiceId)
  if (!invoice || invoice.status === 'void') return invoice
  const collected = monetization.payments
    .filter((payment) => payment.invoiceId === invoiceId)
    .reduce((sum, payment) => {
      if (payment.status === 'succeeded') return sum + payment.amountMxn
      if (payment.status === 'refunded') return sum - payment.amountMxn
      return sum
    }, 0)
  if (collected >= invoice.totalMxn) {
    invoice.status = 'paid'
    invoice.paidAt = invoice.paidAt ?? new Date().toISOString()
  } else if (invoice.status !== 'draft') {
    invoice.status = 'issued'
    invoice.paidAt = null
  }
  invoice.updatedAt = new Date().toISOString()
  return invoice
}

function buildMonetizationFinanceSummary(dateFromRaw: string, dateToRaw: string, options?: { incomeMode?: 'gross' | 'net'; vatRate?: number; withholdingRate?: number; isrMode?: MonetizationIsrMode; isrRate?: number | null; presetId?: string }) {
  const fromMs = Date.parse(dateFromRaw)
  const toMs = Date.parse(dateToRaw)
  const inRange = (iso: string | null | undefined) => {
    if (!iso) return false
    const ts = Date.parse(iso)
    return !Number.isNaN(ts) && ts >= fromMs && ts <= toMs
  }
  const preset = options?.presetId ? monetization.financePresets.find((item) => item.id === options.presetId) : null
  const vatRate = options?.vatRate ?? preset?.vatRate ?? 0.16
  const withholdingRate = options?.withholdingRate ?? 0
  const isrMode = options?.isrMode ?? preset?.isrMode ?? 'none'
  const isrRate = options?.isrRate ?? preset?.isrRate ?? null
  const incomeMode = options?.incomeMode ?? 'gross'

  const paidInvoices = monetization.invoices.filter((invoice) => invoice.status === 'paid' && inRange(invoice.paidAt))
  const payments = monetization.payments.filter((payment) => inRange(payment.createdAt))
  const ledger = monetization.ledgerEntries.filter((entry) => inRange(entry.occurredAt))

  const paidInvoiceGrossIncomeMxn = paidInvoices.reduce((sum, invoice) => sum + invoice.totalMxn, 0)
  const collectedVatMxn = paidInvoices.reduce((sum, invoice) => sum + invoice.taxMxn, 0)
  const paidInvoiceNetIncomeMxn = payments.reduce((sum, payment) => {
    if (payment.status === 'succeeded') return sum + payment.netMxn
    if (payment.status === 'refunded') return sum - Math.abs(payment.netMxn)
    return sum
  }, 0)
  const manualIncomeMxn = ledger.filter((e) => e.type === 'revenue' && e.category !== 'invoice_payment').reduce((sum, e) => sum + Math.max(e.amountMxn, 0), 0)
  const refundsMxn = ledger.filter((e) => e.type === 'refund').reduce((sum, e) => sum + Math.abs(e.amountMxn), 0)
  const manualExpensesMxn = ledger.filter((e) => e.type === 'expense' || e.type === 'adjustment').reduce((sum, e) => sum + Math.abs(e.amountMxn), 0)
  const feesMxn = payments.reduce((sum, p) => sum + Math.max(p.feeMxn, 0), 0)
  const expenseVatMxn = ledger.filter((e) => e.type === 'expense').reduce((sum, e) => sum + (typeof e.metadata.vatMxn === 'number' ? Math.max(Math.round(e.metadata.vatMxn), 0) : 0), 0)
  const expensesMxn = manualExpensesMxn + refundsMxn + feesMxn
  const incomeBasisMxn = incomeMode === 'net' ? paidInvoiceNetIncomeMxn + manualIncomeMxn : paidInvoiceGrossIncomeMxn + manualIncomeMxn
  const taxableBaseMxn = Math.max(0, incomeBasisMxn - expensesMxn)
  const vatPayableMxn = Math.max(0, collectedVatMxn - expenseVatMxn)
  const withholdingMxn = Math.round(taxableBaseMxn * withholdingRate)
  let estimatedIsrMxn = 0
  if (isrMode === 'simple_rate') estimatedIsrMxn = Math.round(taxableBaseMxn * Math.max(0, isrRate ?? 0))
  const totalEstimatedTaxesMxn = vatPayableMxn + withholdingMxn + estimatedIsrMxn
  const profitAfterTaxesMxn = incomeBasisMxn - expensesMxn - totalEstimatedTaxesMxn
  const effectiveTaxRate = incomeBasisMxn > 0 ? Number((totalEstimatedTaxesMxn / incomeBasisMxn).toFixed(4)) : 0
  const rows = [
    ['gross_income_mxn', paidInvoiceGrossIncomeMxn + manualIncomeMxn],
    ['net_income_mxn', paidInvoiceNetIncomeMxn + manualIncomeMxn],
    ['expenses_mxn', expensesMxn],
    ['taxable_base_mxn', taxableBaseMxn],
    ['vat_payable_mxn', vatPayableMxn],
    ['estimated_isr_mxn', estimatedIsrMxn],
    ['profit_after_taxes_mxn', profitAfterTaxesMxn],
    ['effective_tax_rate_pct', Number((effectiveTaxRate * 100).toFixed(2))],
  ]
  const csv = [csvMockRow(['metric', 'amount']), ...rows.map((r) => csvMockRow([r[0], r[1]]))].join('\n')
  return {
    period: { dateFrom: dateFromRaw, dateTo: dateToRaw },
    settings: {
      presetId: preset?.id ?? null,
      incomeMode,
      vatRate,
      withholdingRate,
      isrMode,
      isrRate,
      brackets: preset?.bracketsJson ?? [],
    },
    inputs: { paidInvoiceGrossIncomeMxn, paidInvoiceNetIncomeMxn, manualIncomeMxn, refundsMxn, manualExpensesMxn, feesMxn, expenseVatMxn, collectedVatMxn },
    result: {
      grossIncomeMxn: paidInvoiceGrossIncomeMxn + manualIncomeMxn,
      netIncomeMxn: paidInvoiceNetIncomeMxn + manualIncomeMxn,
      expensesMxn,
      taxableBaseMxn,
      vatCollectedMxn: collectedVatMxn,
      vatPaidMxn: expenseVatMxn,
      vatPayableMxn,
      withholdingMxn,
      estimatedIsrMxn,
      totalEstimatedTaxesMxn,
      profitAfterTaxesMxn,
      effectiveTaxRate,
    },
    exportFiles: {
      jsonFilename: 'Director_finance_summary.json',
      csvFilename: 'director_finance_report.csv',
      csv,
    },
  }
}

function buildMonetizationReport(dateFromRaw?: string | null, dateToRaw?: string | null, granularity: 'day' | 'week' | 'month' = 'month') {
  const fromIso = dateFromRaw ?? new Date(Date.now() - 90 * 24 * 3600_000).toISOString()
  const toIso = dateToRaw ?? new Date().toISOString()
  const fromMs = Date.parse(fromIso)
  const toMs = Date.parse(toIso)
  const inRange = (iso: string | null | undefined) => {
    if (!iso) return false
    const ts = Date.parse(iso)
    return !Number.isNaN(ts) && ts >= fromMs && ts <= toMs
  }
  const bucket = (iso: string) => {
    const d = new Date(iso)
    if (granularity === 'day') return d.toISOString().slice(0, 10)
    if (granularity === 'month') return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    const w = new Date(d)
    const shift = (w.getUTCDay() + 6) % 7
    w.setUTCDate(w.getUTCDate() - shift)
    w.setUTCHours(0, 0, 0, 0)
    return w.toISOString().slice(0, 10)
  }

  const paidInvoices = monetization.invoices.filter((invoice) => invoice.status === 'paid' && inRange(invoice.paidAt))
  const periodMap = new Map<string, { period: string; totalMxn: number; invoices: number }>()
  for (const invoice of paidInvoices) {
    const key = bucket(invoice.paidAt ?? invoice.createdAt)
    const row = periodMap.get(key) ?? { period: key, totalMxn: 0, invoices: 0 }
    row.totalMxn += invoice.totalMxn
    row.invoices += 1
    periodMap.set(key, row)
  }
  const revenueByPeriod = Array.from(periodMap.values()).sort((a, b) => a.period.localeCompare(b.period))

  const planMap = new Map<string, { planId: string; planName: string; totalMxn: number; invoices: number }>()
  for (const invoice of paidInvoices) {
    const sub = invoice.subscriptionId ? monetizationSubscriptionById(invoice.subscriptionId) : null
    const plan = sub ? monetizationPlanById(sub.planId) : null
    const key = plan?.id ?? 'no-plan'
    const row = planMap.get(key) ?? { planId: key, planName: plan?.name ?? 'Sin plan', totalMxn: 0, invoices: 0 }
    row.totalMxn += invoice.totalMxn
    row.invoices += 1
    planMap.set(key, row)
  }
  const revenueByPlan = Array.from(planMap.values()).sort((a, b) => b.totalMxn - a.totalMxn)

  const openInvoices = monetization.invoices
    .filter((invoice) => invoice.status === 'draft' || invoice.status === 'issued')
    .map(enrichInvoice)
  const nowMs = Date.now()
  const pastDue = openInvoices.filter((invoice) => invoice.dueAt && Date.parse(invoice.dueAt) < nowMs)
  const feesAbnormal = monetization.payments
    .filter((p) => inRange(p.createdAt) && p.amountMxn > 0 && p.feeMxn / p.amountMxn >= 0.08)
    .map((p) => ({ paymentId: p.id, invoiceId: p.invoiceId, amountMxn: p.amountMxn, feeMxn: p.feeMxn, feeRate: Number((p.feeMxn / p.amountMxn).toFixed(4)) }))

  return {
    filters: { dateFrom: fromIso, dateTo: toIso, granularity },
    revenueByPeriod,
    revenueByPlan,
    ar: {
      items: openInvoices,
      summary: {
        openCount: openInvoices.length,
        openTotalMxn: openInvoices.reduce((sum, i) => sum + i.totalMxn, 0),
        pastDueCount: pastDue.length,
        pastDueTotalMxn: pastDue.reduce((sum, i) => sum + i.totalMxn, 0),
      },
    },
    fees: {
      totalFeesMxn: monetization.payments.filter((p) => inRange(p.createdAt)).reduce((sum, p) => sum + p.feeMxn, 0),
      totalGrossMxn: monetization.payments.filter((p) => inRange(p.createdAt)).reduce((sum, p) => sum + p.amountMxn, 0),
      totalRefundsMxn: monetization.payments.filter((p) => inRange(p.createdAt) && p.status === 'refunded').reduce((sum, p) => sum + p.amountMxn, 0),
      abnormal: feesAbnormal,
    },
  }
}

function seedMonetizationIfEmpty() {
  if (monetization.invoices.length > 0) return
  const now = new Date()
  const createdAt = new Date(now.getTime() - 5 * 24 * 3600_000).toISOString()
  const dueAt = new Date(now.getTime() - 2 * 24 * 3600_000).toISOString()
  const paidAt = new Date(now.getTime() - 1 * 24 * 3600_000).toISOString()
  const invoice: MonetizationInvoice = {
    id: 'inv-01',
    clubId: 'club-01',
    subscriptionId: 'sub-01',
    type: 'subscription',
    subtotalMxn: 149900,
    taxMxn: 23984,
    totalMxn: 173884,
    status: 'paid',
    issuedAt: createdAt,
    dueAt,
    paidAt,
    items: [{ description: 'Suscripcion mensual', qty: 1, unit_price_mxn: 149900, line_total_mxn: 149900 }],
    notes: 'Seed invoice',
    createdAt,
    updatedAt: paidAt,
  }
  const payment: MonetizationPayment = {
    id: 'paym-01',
    invoiceId: invoice.id,
    clubId: invoice.clubId,
    method: 'transfer',
    provider: 'manual',
    providerRef: 'seed-pay-ref-01',
    amountMxn: invoice.totalMxn,
    feeMxn: 1500,
    netMxn: invoice.totalMxn - 1500,
    status: 'succeeded',
    createdAt: paidAt,
    updatedAt: paidAt,
    metadata: {},
  }
  monetization.invoices.push(invoice)
  monetization.payments.push(payment)
  monetization.ledgerEntries.push(
    {
      id: 'ledg-01',
      clubId: 'club-01',
      type: 'revenue',
      category: 'invoice_payment',
      amountMxn: payment.amountMxn,
      referenceType: 'payment',
      referenceId: payment.id,
      occurredAt: paidAt,
      notes: null,
      metadata: {},
      createdAt: paidAt,
    },
    {
      id: 'ledg-02',
      clubId: 'club-01',
      type: 'fee',
      category: 'payment_fee',
      amountMxn: -1500,
      referenceType: 'payment',
      referenceId: payment.id,
      occurredAt: paidAt,
      notes: null,
      metadata: {},
      createdAt: paidAt,
    },
    {
      id: 'ledg-03',
      clubId: 'club-01',
      type: 'expense',
      category: 'infra',
      amountMxn: -18000,
      referenceType: null,
      referenceId: null,
      occurredAt: new Date(now.getTime() - 3 * 24 * 3600_000).toISOString(),
      notes: 'Hosting',
      metadata: { vatMxn: 2482 },
      createdAt: new Date(now.getTime() - 3 * 24 * 3600_000).toISOString(),
    },
  )
  monetization.seq.invoice = Math.max(monetization.seq.invoice, 2)
  monetization.seq.payment = Math.max(monetization.seq.payment, 2)
  monetization.seq.ledger = Math.max(monetization.seq.ledger, 3)
}

seedMonetizationIfEmpty()

function nextId(key: keyof State['seq'], prefix: string) {
  const n = state.seq[key]
  state.seq[key] = n + 1
  return `${prefix}${String(n).padStart(2, '0')}`
}

function parseBody(init?: RequestInit) {
  if (!init?.body || typeof init.body !== 'string') return null
  try {
    return JSON.parse(init.body) as Record<string, unknown>
  } catch {
    return null
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

function err(message: string, status = 400) {
  return json({ message }, status)
}

function blob(data: Blob, status = 200) {
  return new Response(data, { status, headers: { 'Content-Type': data.type || 'application/octet-stream' } })
}

function roleFrom(raw: string): UserRole {
  const value = raw.trim().toLowerCase()
  if (value.includes('director') || value.startsWith('dir')) return 'DIRECTOR'
  if (value.includes('scanner') || value.includes('staff')) return 'SCANNER'
  if (value.includes('rp') || value.includes('promo')) return 'RP'
  return 'MANAGER'
}

function session(): Session | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

function currentRp() {
  const s = session()
  if (s?.role === 'RP') {
    const byUser = state.rps.find((item) => item.user.username.toLowerCase() === s.userId.toLowerCase())
    if (byUser) return byUser
  }
  return state.rps[0]!
}

function countTickets(eventId: string, rpId: string, type?: GuestType) {
  return state.tickets.filter((t) => t.eventId === eventId && t.rpId === rpId && (!type || t.guestType === type)).length
}

function managerDto(manager: ManagerAccount) {
  return {
    id: manager.id,
    active: manager.active,
    user: manager.user,
    clubs: manager.clubIds
      .map((clubId) => state.clubs.find((club) => club.id === clubId))
      .filter(Boolean)
      .map((club) => ({ id: club!.id, name: club!.name, active: club!.active })),
    subscription: manager.subscription,
    billing: manager.billing,
  }
}

function eventDto(event: Event) {
  const club = state.clubs.find((item) => item.id === event.clubId)
  const assignments = state.assignments
    .filter((a) => a.eventId === event.id)
    .map((a) => {
      const rp = state.rps.find((item) => item.id === a.rpId)
      if (!rp) return null
      return {
        id: a.id,
        eventId: a.eventId,
        rpId: a.rpId,
        limitAccesses: a.limitAccesses,
        usedAccesses: countTickets(a.eventId, a.rpId),
        rp,
      }
    })
    .filter(Boolean)

  return {
    id: event.id,
    name: event.name,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    active: event.active,
    club: { id: club?.id ?? event.clubId, name: club?.name ?? 'Club', active: club?.active ?? true },
    assignments,
    templateImageUrl: event.templateImageUrl,
    qrPositionX: event.qrPositionX,
    qrPositionY: event.qrPositionY,
    qrSize: event.qrSize,
  }
}

function applyDateFilter(tickets: Ticket[], from: string | null, to: string | null) {
  const fromMs = from ? Date.parse(from) : null
  const toMs = to ? Date.parse(to) : null
  return tickets.filter((ticket) => {
    const source = ticket.scannedAt ?? ticket.createdAt
    const ts = Date.parse(source)
    if (Number.isNaN(ts)) return false
    if (fromMs !== null && ts < fromMs) return false
    if (toMs !== null && ts > toMs) return false
    return true
  })
}

function aggregateCuts(params: { eventId?: string | null; rpId?: string | null; from?: string | null; to?: string | null }) {
  const scanned = applyDateFilter(
    state.tickets.filter((t) => t.status === 'SCANNED'),
    params.from ?? null,
    params.to ?? null,
  ).filter((t) => {
    if (params.eventId && t.eventId !== params.eventId) return false
    if (params.rpId && t.rpId !== params.rpId) return false
    return true
  })

  const byEvent = new Map<
    string,
    {
      eventId: string
      eventName: string
      startsAt: string
      endsAt: string
      clubName: string
      totalGeneral: number
      totalVip: number
      totalOther: number
      total: number
      rps: Map<string, { rpId: string; rpName: string; totalGeneral: number; totalVip: number; totalOther: number; total: number }>
    }
  >()
  let totalGeneral = 0
  let totalVip = 0
  let totalOther = 0
  let total = 0

  for (const ticket of scanned) {
    const event = state.events.find((item) => item.id === ticket.eventId)
    const rp = state.rps.find((item) => item.id === ticket.rpId)
    if (!event || !rp) continue
    const club = state.clubs.find((item) => item.id === event.clubId)
    const eventEntry = byEvent.get(event.id) ?? {
      eventId: event.id,
      eventName: event.name,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      clubName: club?.name ?? 'Club',
      totalGeneral: 0,
      totalVip: 0,
      totalOther: 0,
      total: 0,
      rps: new Map(),
    }
    const rpEntry = eventEntry.rps.get(rp.id) ?? { rpId: rp.id, rpName: rp.user.name, totalGeneral: 0, totalVip: 0, totalOther: 0, total: 0 }

    if (ticket.guestType === 'GENERAL') {
      eventEntry.totalGeneral += 1
      rpEntry.totalGeneral += 1
      totalGeneral += 1
    } else if (ticket.guestType === 'VIP') {
      eventEntry.totalVip += 1
      rpEntry.totalVip += 1
      totalVip += 1
    } else {
      eventEntry.totalOther += 1
      rpEntry.totalOther += 1
      totalOther += 1
    }
    eventEntry.total += 1
    rpEntry.total += 1
    total += 1

    eventEntry.rps.set(rp.id, rpEntry)
    byEvent.set(event.id, eventEntry)
  }

  const events = Array.from(byEvent.values())
    .map((e) => ({
      eventId: e.eventId,
      eventName: e.eventName,
      startsAt: e.startsAt,
      endsAt: e.endsAt,
      clubName: e.clubName,
      totalGeneral: e.totalGeneral,
      totalVip: e.totalVip,
      totalOther: e.totalOther,
      total: e.total,
      rps: Array.from(e.rps.values()).sort((a, b) => b.total - a.total),
    }))
    .sort((a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt))

  return { events, totalGeneral, totalVip, totalOther, total }
}

function ticketSvg(ticketId: string) {
  const safe = ticketId.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="100%" height="100%" fill="#fff"/><rect x="24" y="24" width="464" height="464" rx="24" fill="#f4f8ff" stroke="#067dff" stroke-width="8"/><rect x="74" y="100" width="364" height="240" rx="18" fill="#071529"/><text x="256" y="84" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" fill="#067dff">PASS MONKEY</text><text x="256" y="382" text-anchor="middle" font-family="Arial,sans-serif" font-size="24" fill="#071529">${safe}</text><text x="256" y="420" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" fill="#3f556d">Mock Ticket</text></svg>`
  return new Blob([svg], { type: 'image/svg+xml' })
}

function managerCutDetailPayload(eventId: string, rpId: string, from: string | null, to: string | null) {
  const event = state.events.find((item) => item.id === eventId)
  const rp = state.rps.find((item) => item.id === rpId)
  if (!event || !rp) return null
  const scans = applyDateFilter(
    state.tickets.filter((t) => t.status === 'SCANNED' && t.eventId === eventId && t.rpId === rpId),
    from,
    to,
  )
    .sort((a, b) => Date.parse(b.scannedAt ?? '') - Date.parse(a.scannedAt ?? ''))
    .map((t) => ({
      ticketId: t.id,
      guestType: t.guestType,
      displayLabel: t.guestType === 'OTHER' ? state.otherLabel : t.guestType,
      note: t.note,
      scannedAt: t.scannedAt ?? t.createdAt,
      scannerName: t.scannerName ?? 'Scanner Mock',
    }))

  return {
    event: { id: event.id, name: event.name, startsAt: event.startsAt, endsAt: event.endsAt },
    rp: { id: rp.id, name: rp.user.name },
    total: scans.length,
    scans,
  }
}

function parsePagination(url: URL, defaults: { page?: number; pageSize?: number } = {}) {
  const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? String(defaults.page ?? 1), 10) || 1)
  const pageSize = Math.max(1, Math.min(100, Number.parseInt(url.searchParams.get('pageSize') ?? String(defaults.pageSize ?? 20), 10) || 20))
  return { page, pageSize, start: (page - 1) * pageSize, end: (page - 1) * pageSize + pageSize }
}

function maybeDateRangeFilter(iso: string | null | undefined, fromRaw: string | null, toRaw: string | null) {
  if (!iso) return false
  const ts = Date.parse(iso)
  if (Number.isNaN(ts)) return false
  const from = fromRaw ? Date.parse(fromRaw) : null
  const to = toRaw ? Date.parse(toRaw) : null
  if (from !== null && !Number.isNaN(from) && ts < from) return false
  if (to !== null && !Number.isNaN(to) && ts > to) return false
  return true
}

function csvMockRow(values: Array<string | number>) {
  return values.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')
}

function handleDirectorMonetizationRoutes(url: URL, method: string, body: Record<string, unknown> | null): Response | null {
  const pathname = url.pathname

  if (pathname === '/director/clubs' && method === 'GET') {
    return json(state.clubs.map(directorClubDto))
  }

  if (pathname === '/director/plans' && method === 'GET') {
    const { page, pageSize, start, end } = parsePagination(url, { pageSize: 20 })
    const status = url.searchParams.get('status')
    const q = (url.searchParams.get('q') ?? '').trim().toLowerCase()
    const filtered = monetization.plans.filter((plan) => {
      if (status && plan.status !== status) return false
      if (q && !`${plan.name} ${plan.description ?? ''}`.toLowerCase().includes(q)) return false
      return true
    })
    return json({ items: filtered.slice(start, end), total: filtered.length, page, pageSize })
  }

  if (pathname === '/director/plans' && method === 'POST') {
    const now = new Date().toISOString()
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    if (!name) return err('Nombre de plan invalido.', 400)
    const plan: MonetizationPlan = {
      id: nextMonetizationId('plan', 'plan-'),
      name,
      description: typeof body?.description === 'string' ? body.description.trim() || null : null,
      billingPeriod: ['monthly', 'annual', 'one_time'].includes(String(body?.billingPeriod)) ? (body?.billingPeriod as MonetizationBillingPeriod) : 'monthly',
      priceMxn: Math.max(0, Number.parseInt(String(body?.priceMxn ?? '0'), 10) || 0),
      currency: 'MXN',
      includedEventsPerMonth: body?.includedEventsPerMonth == null ? null : Math.max(0, Number.parseInt(String(body.includedEventsPerMonth), 10) || 0),
      entitlements: body?.entitlements && typeof body.entitlements === 'object' && !Array.isArray(body.entitlements) ? (body.entitlements as Record<string, unknown>) : {},
      overagePricePerEventMxn: body?.overagePricePerEventMxn == null ? null : Math.max(0, Number.parseInt(String(body.overagePricePerEventMxn), 10) || 0),
      status: body?.status === 'archived' ? 'archived' : 'active',
      createdAt: now,
      updatedAt: now,
    }
    monetization.plans.unshift(plan)
    return json(plan, 201)
  }

  const planMatch = pathname.match(/^\/director\/plans\/([^/]+)$/)
  if (planMatch && method === 'GET') {
    const plan = monetization.plans.find((item) => item.id === planMatch[1])
    return plan ? json(plan) : err('Plan no encontrado.', 404)
  }
  if (planMatch && method === 'PATCH') {
    const plan = monetization.plans.find((item) => item.id === planMatch[1])
    if (!plan) return err('Plan no encontrado.', 404)
    if (typeof body?.name === 'string') plan.name = body.name.trim() || plan.name
    if (typeof body?.description === 'string' || body?.description === null) plan.description = (body?.description as string | null) ?? null
    if (body?.billingPeriod === 'monthly' || body?.billingPeriod === 'annual' || body?.billingPeriod === 'one_time') plan.billingPeriod = body.billingPeriod
    if (body?.priceMxn !== undefined) plan.priceMxn = Math.max(0, Number.parseInt(String(body.priceMxn), 10) || 0)
    if (typeof body?.status === 'string' && (body.status === 'active' || body.status === 'archived')) plan.status = body.status
    if (body?.includedEventsPerMonth !== undefined) plan.includedEventsPerMonth = body.includedEventsPerMonth === null ? null : Math.max(0, Number.parseInt(String(body.includedEventsPerMonth), 10) || 0)
    if (body?.overagePricePerEventMxn !== undefined) plan.overagePricePerEventMxn = body.overagePricePerEventMxn === null ? null : Math.max(0, Number.parseInt(String(body.overagePricePerEventMxn), 10) || 0)
    if (body?.entitlements && typeof body.entitlements === 'object' && !Array.isArray(body.entitlements)) plan.entitlements = body.entitlements as Record<string, unknown>
    plan.updatedAt = new Date().toISOString()
    return json(plan)
  }
  if (planMatch && method === 'DELETE') {
    const plan = monetization.plans.find((item) => item.id === planMatch[1])
    if (!plan) return err('Plan no encontrado.', 404)
    plan.status = 'archived'
    plan.updatedAt = new Date().toISOString()
    return new Response(null, { status: 204 })
  }

  if (pathname === '/director/subscriptions' && method === 'GET') {
    const { page, pageSize, start, end } = parsePagination(url, { pageSize: 20 })
    const status = url.searchParams.get('status')
    const clubId = url.searchParams.get('clubId')
    const planId = url.searchParams.get('planId')
    const q = (url.searchParams.get('q') ?? '').trim().toLowerCase()
    const filtered = monetization.subscriptions.filter((sub) => {
      if (status && sub.status !== status) return false
      if (clubId && sub.clubId !== clubId) return false
      if (planId && sub.planId !== planId) return false
      if (q) {
        const club = state.clubs.find((c) => c.id === sub.clubId)
        const plan = monetizationPlanById(sub.planId)
        const haystack = `${club?.name ?? ''} ${plan?.name ?? ''}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
    return json({
      items: filtered.slice(start, end).map(enrichSubscription),
      total: filtered.length,
      page,
      pageSize,
    })
  }

  if (pathname === '/director/subscriptions' && method === 'POST') {
    const now = new Date().toISOString()
    const clubId = typeof body?.clubId === 'string' ? body.clubId : ''
    const planId = typeof body?.planId === 'string' ? body.planId : ''
    if (!state.clubs.some((club) => club.id === clubId)) return err('Club no encontrado.', 404)
    if (!monetization.plans.some((plan) => plan.id === planId)) return err('Plan no encontrado.', 404)
    const sub: MonetizationSubscription = {
      id: nextMonetizationId('subscription', 'sub-'),
      clubId,
      planId,
      status:
        body?.status === 'trialing' || body?.status === 'active' || body?.status === 'past_due' || body?.status === 'canceled' || body?.status === 'paused'
          ? body.status
          : 'active',
      startAt: typeof body?.startAt === 'string' ? body.startAt : now,
      currentPeriodStart: typeof body?.currentPeriodStart === 'string' ? body.currentPeriodStart : now,
      currentPeriodEnd: typeof body?.currentPeriodEnd === 'string' ? body.currentPeriodEnd : isoOffset(24 * 30),
      cancelAtPeriodEnd: typeof body?.cancelAtPeriodEnd === 'boolean' ? body.cancelAtPeriodEnd : false,
      trialEndAt: typeof body?.trialEndAt === 'string' ? body.trialEndAt : body?.trialEndAt === null ? null : null,
      seatsHostsLimit: body?.seatsHostsLimit == null ? null : Math.max(0, Number.parseInt(String(body.seatsHostsLimit), 10) || 0),
      metadata: body?.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata) ? (body.metadata as Record<string, unknown>) : {},
      overrides: body?.overrides && typeof body.overrides === 'object' && !Array.isArray(body.overrides) ? (body.overrides as Record<string, unknown>) : {},
      createdAt: now,
      updatedAt: now,
    }
    monetization.subscriptions.unshift(sub)
    return json(enrichSubscription(sub), 201)
  }

  const subscriptionMatch = pathname.match(/^\/director\/subscriptions\/([^/]+)$/)
  if (subscriptionMatch && method === 'PATCH') {
    const sub = monetization.subscriptions.find((item) => item.id === subscriptionMatch[1])
    if (!sub) return err('Suscripcion no encontrada.', 404)
    if (typeof body?.planId === 'string' && monetization.plans.some((p) => p.id === body.planId)) sub.planId = body.planId
    if (typeof body?.status === 'string' && ['trialing', 'active', 'past_due', 'canceled', 'paused'].includes(body.status)) {
      sub.status = body.status as MonetizationSubscriptionStatus
    }
    if (typeof body?.currentPeriodStart === 'string') sub.currentPeriodStart = body.currentPeriodStart
    if (typeof body?.currentPeriodEnd === 'string') sub.currentPeriodEnd = body.currentPeriodEnd
    if (typeof body?.cancelAtPeriodEnd === 'boolean') sub.cancelAtPeriodEnd = body.cancelAtPeriodEnd
    if (typeof body?.trialEndAt === 'string' || body?.trialEndAt === null) sub.trialEndAt = body.trialEndAt as string | null
    if (body?.seatsHostsLimit !== undefined) sub.seatsHostsLimit = body.seatsHostsLimit === null ? null : Math.max(0, Number.parseInt(String(body.seatsHostsLimit), 10) || 0)
    if (body?.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)) sub.metadata = body.metadata as Record<string, unknown>
    if (body?.overrides && typeof body.overrides === 'object' && !Array.isArray(body.overrides)) sub.overrides = body.overrides as Record<string, unknown>
    sub.updatedAt = new Date().toISOString()
    return json(enrichSubscription(sub))
  }

  if (pathname === '/director/invoices' && method === 'GET') {
    const { page, pageSize, start, end } = parsePagination(url, { pageSize: 20 })
    const status = url.searchParams.get('status')
    const clubId = url.searchParams.get('clubId')
    const dateFrom = url.searchParams.get('dateFrom')
    const dateTo = url.searchParams.get('dateTo')
    const filtered = monetization.invoices.filter((invoice) => {
      if (status && invoice.status !== status) return false
      if (clubId && invoice.clubId !== clubId) return false
      if (dateFrom || dateTo) {
        const ok =
          maybeDateRangeFilter(invoice.issuedAt, dateFrom, dateTo) ||
          maybeDateRangeFilter(invoice.dueAt, dateFrom, dateTo) ||
          maybeDateRangeFilter(invoice.paidAt, dateFrom, dateTo)
        if (!ok) return false
      }
      return true
    })
    const items = filtered.slice(start, end).map(enrichInvoice)
    return json({
      items,
      total: filtered.length,
      page,
      pageSize,
      summary: {
        openCount: items.filter((i) => i.status !== 'paid' && i.status !== 'void').length,
        pastDueCount: items.filter((i) => i.status !== 'paid' && i.status !== 'void' && i.dueAt && Date.parse(i.dueAt) < Date.now()).length,
      },
    })
  }

  if (pathname === '/director/invoices' && method === 'POST') {
    const clubId = typeof body?.clubId === 'string' ? body.clubId : ''
    if (!state.clubs.some((club) => club.id === clubId)) return err('Club no encontrado.', 404)
    const items = Array.isArray(body?.items)
      ? body.items
          .map((raw) => {
            if (!raw || typeof raw !== 'object') return null
            const item = raw as Record<string, unknown>
            const description = typeof item.description === 'string' ? item.description.trim() : ''
            const qty = Number.parseInt(String(item.qty ?? '0'), 10) || 0
            const unitPriceMxn = Number.parseInt(String(item.unitPriceMxn ?? '0'), 10) || 0
            if (!description || qty <= 0 || unitPriceMxn < 0) return null
            return { description, qty, unit_price_mxn: unitPriceMxn, line_total_mxn: qty * unitPriceMxn }
          })
          .filter(Boolean) as MonetizationInvoiceItem[]
      : []
    if (items.length === 0) return err('Items invalidos.', 400)
    const taxRate = Math.max(0, Number(body?.taxRate) || 0)
    const subtotalMxn = items.reduce((sum, item) => sum + item.line_total_mxn, 0)
    const taxMxn = Math.round(subtotalMxn * taxRate)
    const totalMxn = subtotalMxn + taxMxn
    const now = new Date().toISOString()
    const invoice: MonetizationInvoice = {
      id: nextMonetizationId('invoice', 'inv-'),
      clubId,
      subscriptionId: typeof body?.subscriptionId === 'string' ? body.subscriptionId : body?.subscriptionId === null ? null : null,
      type: body?.type === 'topup' || body?.type === 'manual_adjustment' ? (body.type as MonetizationInvoiceType) : 'subscription',
      subtotalMxn,
      taxMxn,
      totalMxn,
      status: ['draft', 'issued', 'paid', 'void'].includes(String(body?.status)) ? (body?.status as MonetizationInvoiceStatus) : 'issued',
      issuedAt: typeof body?.issuedAt === 'string' ? body.issuedAt : body?.status === 'draft' ? null : now,
      dueAt: typeof body?.dueAt === 'string' ? body.dueAt : body?.dueAt === null ? null : null,
      paidAt: body?.status === 'paid' ? now : null,
      items,
      notes: typeof body?.notes === 'string' ? body.notes : body?.notes === null ? null : null,
      createdAt: now,
      updatedAt: now,
    }
    monetization.invoices.unshift(invoice)
    return json(invoice, 201)
  }

  const invoiceMatch = pathname.match(/^\/director\/invoices\/([^/]+)$/)
  if (invoiceMatch && method === 'GET') {
    const invoice = monetizationInvoiceById(invoiceMatch[1])
    return invoice ? json(enrichInvoice(invoice)) : err('Factura no encontrada.', 404)
  }

  const invoicePaymentMatch = pathname.match(/^\/director\/invoices\/([^/]+)\/payments$/)
  if (invoicePaymentMatch && method === 'POST') {
    const invoice = monetizationInvoiceById(invoicePaymentMatch[1])
    if (!invoice) return err('Factura no encontrada.', 404)
    const provider = ['manual', 'stripe', 'conekta', 'mercadopago', 'openpay'].includes(String(body?.provider))
      ? (body?.provider as MonetizationPaymentProvider)
      : 'manual'
    const providerRef = typeof body?.providerRef === 'string' ? body.providerRef.trim() : ''
    if (providerRef) {
      const duplicate = monetization.payments.find((p) => p.provider === provider && p.providerRef === providerRef)
      if (duplicate) return json({ payment: duplicate, invoice: enrichInvoice(recalcInvoiceStatusMock(duplicate.invoiceId)!), idempotent: true })
    }
    const amountMxn = Math.max(0, Number.parseInt(String(body?.amountMxn ?? '0'), 10) || 0)
    if (amountMxn <= 0) return err('Monto de pago invalido.', 400)
    const feeMxn = Math.max(0, Number.parseInt(String(body?.feeMxn ?? '0'), 10) || 0)
    const now = typeof body?.createdAt === 'string' ? body.createdAt : new Date().toISOString()
    const payment: MonetizationPayment = {
      id: nextMonetizationId('payment', 'paym-'),
      invoiceId: invoice.id,
      clubId: invoice.clubId,
      method: ['cash', 'transfer', 'card', 'provider'].includes(String(body?.method)) ? (body?.method as MonetizationPaymentMethod) : 'transfer',
      provider,
      providerRef: providerRef || null,
      amountMxn,
      feeMxn,
      netMxn: amountMxn - feeMxn,
      status: ['pending', 'succeeded', 'failed', 'refunded'].includes(String(body?.status)) ? (body?.status as MonetizationPaymentStatus) : 'succeeded',
      createdAt: now,
      updatedAt: now,
      metadata: body?.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata) ? (body.metadata as Record<string, unknown>) : {},
    }
    monetization.payments.unshift(payment)
    if (payment.status === 'succeeded') {
      monetization.ledgerEntries.unshift(
        {
          id: nextMonetizationId('ledger', 'ledg-'),
          clubId: payment.clubId,
          type: 'revenue',
          category: 'invoice_payment',
          amountMxn: payment.amountMxn,
          referenceType: 'payment',
          referenceId: payment.id,
          occurredAt: payment.createdAt,
          notes: null,
          metadata: {},
          createdAt: payment.createdAt,
        },
        ...(payment.feeMxn > 0
          ? [{
              id: nextMonetizationId('ledger', 'ledg-'),
              clubId: payment.clubId,
              type: 'fee' as const,
              category: 'payment_fee',
              amountMxn: -payment.feeMxn,
              referenceType: 'payment',
              referenceId: payment.id,
              occurredAt: payment.createdAt,
              notes: null,
              metadata: {},
              createdAt: payment.createdAt,
            }]
          : []),
      )
    }
    const updatedInvoice = recalcInvoiceStatusMock(invoice.id)!
    return json({ payment, invoice: enrichInvoice(updatedInvoice), idempotent: false })
  }

  const paymentRefundMatch = pathname.match(/^\/director\/payments\/([^/]+)\/refund$/)
  if (paymentRefundMatch && method === 'POST') {
    const payment = monetizationPaymentById(paymentRefundMatch[1])
    if (!payment) return err('Pago no encontrado.', 404)
    if (payment.status === 'refunded') return err('Pago ya reembolsado.', 409)
    const refundAmount = body?.amountMxn == null ? payment.amountMxn : Math.max(0, Number.parseInt(String(body.amountMxn), 10) || 0)
    payment.status = 'refunded'
    payment.refundedAt = new Date().toISOString()
    payment.updatedAt = payment.refundedAt
    payment.metadata = { ...(payment.metadata ?? {}), refund: { amountMxn: refundAmount, reason: body?.reason ?? null } }
    monetization.ledgerEntries.unshift({
      id: nextMonetizationId('ledger', 'ledg-'),
      clubId: payment.clubId,
      type: 'refund',
      category: 'payment_refund',
      amountMxn: -Math.abs(refundAmount),
      referenceType: 'payment',
      referenceId: payment.id,
      occurredAt: payment.refundedAt,
      notes: typeof body?.reason === 'string' ? body.reason : null,
      metadata: {},
      createdAt: payment.refundedAt,
    })
    const updatedInvoice = recalcInvoiceStatusMock(payment.invoiceId)
    return json({ payment, invoice: updatedInvoice ? enrichInvoice(updatedInvoice) : null })
  }

  if (pathname === '/director/ledger-entries' && method === 'GET') {
    const { page, pageSize, start, end } = parsePagination(url, { pageSize: 50 })
    const type = url.searchParams.get('type')
    const clubId = url.searchParams.get('clubId')
    const dateFrom = url.searchParams.get('dateFrom')
    const dateTo = url.searchParams.get('dateTo')
    const filtered = monetization.ledgerEntries.filter((entry) => {
      if (type && entry.type !== type) return false
      if (clubId && entry.clubId !== clubId) return false
      if ((dateFrom || dateTo) && !maybeDateRangeFilter(entry.occurredAt, dateFrom, dateTo)) return false
      return true
    })
    return json({ items: filtered.slice(start, end), total: filtered.length, page, pageSize })
  }

  if (pathname === '/director/ledger-entries' && method === 'POST') {
    const amountMxn = Number.parseInt(String(body?.amountMxn ?? '0'), 10)
    const category = typeof body?.category === 'string' ? body.category.trim() : ''
    const type = typeof body?.type === 'string' ? body.type : ''
    const occurredAt = typeof body?.occurredAt === 'string' ? body.occurredAt : new Date().toISOString()
    if (!category || !['revenue', 'expense', 'tax', 'refund', 'fee', 'adjustment'].includes(type) || !Number.isFinite(amountMxn)) {
      return err('Movimiento invalido.', 400)
    }
    const entry: MonetizationLedgerEntry = {
      id: nextMonetizationId('ledger', 'ledg-'),
      clubId: typeof body?.clubId === 'string' ? body.clubId : body?.clubId === null ? null : null,
      type: type as MonetizationLedgerType,
      category,
      amountMxn,
      referenceType: typeof body?.referenceType === 'string' ? body.referenceType : body?.referenceType === null ? null : null,
      referenceId: typeof body?.referenceId === 'string' ? body.referenceId : body?.referenceId === null ? null : null,
      occurredAt,
      notes: typeof body?.notes === 'string' ? body.notes : body?.notes === null ? null : null,
      metadata: body?.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata) ? (body.metadata as Record<string, unknown>) : {},
      createdAt: new Date().toISOString(),
    }
    monetization.ledgerEntries.unshift(entry)
    return json(entry, 201)
  }

  const ledgerMatch = pathname.match(/^\/director\/ledger-entries\/([^/]+)$/)
  if (ledgerMatch && method === 'PATCH') {
    const entry = monetization.ledgerEntries.find((item) => item.id === ledgerMatch[1])
    if (!entry) return err('Movimiento no encontrado.', 404)
    if (typeof body?.type === 'string' && ['revenue', 'expense', 'tax', 'refund', 'fee', 'adjustment'].includes(body.type)) entry.type = body.type as MonetizationLedgerType
    if (typeof body?.category === 'string') entry.category = body.category.trim() || entry.category
    if (body?.amountMxn !== undefined) entry.amountMxn = Number.parseInt(String(body.amountMxn), 10) || entry.amountMxn
    if (typeof body?.occurredAt === 'string') entry.occurredAt = body.occurredAt
    if (typeof body?.notes === 'string' || body?.notes === null) entry.notes = body.notes as string | null
    if (typeof body?.referenceType === 'string' || body?.referenceType === null) entry.referenceType = body.referenceType as string | null
    if (typeof body?.referenceId === 'string' || body?.referenceId === null) entry.referenceId = body.referenceId as string | null
    if (body?.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)) entry.metadata = body.metadata as Record<string, unknown>
    return json(entry)
  }
  if (ledgerMatch && method === 'DELETE') {
    const before = monetization.ledgerEntries.length
    monetization.ledgerEntries = monetization.ledgerEntries.filter((item) => item.id !== ledgerMatch[1])
    if (monetization.ledgerEntries.length === before) return err('Movimiento no encontrado.', 404)
    return new Response(null, { status: 204 })
  }

  if (pathname === '/director/finance-presets' && method === 'GET') {
    return json({ items: monetization.financePresets })
  }
  if (pathname === '/director/finance-presets' && method === 'POST') {
    const now = new Date().toISOString()
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    if (!name) return err('Preset invalido.', 400)
    const preset: MonetizationFinancePreset = {
      id: nextMonetizationId('preset', 'fp-'),
      directorUserId: 'director.demo',
      name,
      vatRate: Math.max(0, Number(body?.vatRate) || 0.16),
      isrMode: ['none', 'simple_rate', 'brackets'].includes(String(body?.isrMode)) ? (body?.isrMode as MonetizationIsrMode) : 'none',
      isrRate: body?.isrRate == null ? null : Number(body.isrRate),
      bracketsJson: Array.isArray(body?.bracketsJson) ? (body.bracketsJson as MonetizationFinancePreset['bracketsJson']) : [],
      defaultExpenseCategories: Array.isArray(body?.defaultExpenseCategories) ? body.defaultExpenseCategories.filter((i): i is string => typeof i === 'string') : [],
      notes: typeof body?.notes === 'string' ? body.notes : body?.notes === null ? null : null,
      createdAt: now,
      updatedAt: now,
    }
    monetization.financePresets.unshift(preset)
    return json(preset, 201)
  }
  const financePresetMatch = pathname.match(/^\/director\/finance-presets\/([^/]+)$/)
  if (financePresetMatch && method === 'GET') {
    const preset = monetization.financePresets.find((item) => item.id === financePresetMatch[1])
    return preset ? json(preset) : err('Preset no encontrado.', 404)
  }
  if (financePresetMatch && method === 'PATCH') {
    const preset = monetization.financePresets.find((item) => item.id === financePresetMatch[1])
    if (!preset) return err('Preset no encontrado.', 404)
    if (typeof body?.name === 'string') preset.name = body.name.trim() || preset.name
    if (body?.vatRate !== undefined) preset.vatRate = Math.max(0, Number(body.vatRate) || preset.vatRate)
    if (typeof body?.isrMode === 'string' && ['none', 'simple_rate', 'brackets'].includes(body.isrMode)) preset.isrMode = body.isrMode as MonetizationIsrMode
    if (body?.isrRate !== undefined) preset.isrRate = body.isrRate === null ? null : Number(body.isrRate)
    if (Array.isArray(body?.bracketsJson)) preset.bracketsJson = body.bracketsJson as MonetizationFinancePreset['bracketsJson']
    if (Array.isArray(body?.defaultExpenseCategories)) preset.defaultExpenseCategories = body.defaultExpenseCategories.filter((i): i is string => typeof i === 'string')
    if (typeof body?.notes === 'string' || body?.notes === null) preset.notes = body.notes as string | null
    preset.updatedAt = new Date().toISOString()
    return json(preset)
  }
  if (financePresetMatch && method === 'DELETE') {
    const before = monetization.financePresets.length
    monetization.financePresets = monetization.financePresets.filter((item) => item.id !== financePresetMatch[1])
    if (monetization.financePresets.length === before) return err('Preset no encontrado.', 404)
    return new Response(null, { status: 204 })
  }

  if (pathname === '/director/finance/summary' && method === 'GET') {
    const dateFrom = url.searchParams.get('dateFrom')
    const dateTo = url.searchParams.get('dateTo')
    if (!dateFrom || !dateTo) return err('dateFrom y dateTo son obligatorios.', 400)
    return json(
      buildMonetizationFinanceSummary(dateFrom, dateTo, {
        presetId: url.searchParams.get('presetId') ?? undefined,
        incomeMode: (url.searchParams.get('incomeMode') as 'gross' | 'net' | null) ?? undefined,
        vatRate: url.searchParams.get('vatRate') ? Number(url.searchParams.get('vatRate')) : undefined,
        withholdingRate: url.searchParams.get('withholdingRate') ? Number(url.searchParams.get('withholdingRate')) : undefined,
        isrMode: (url.searchParams.get('isrMode') as MonetizationIsrMode | null) ?? undefined,
        isrRate: url.searchParams.get('isrRate') ? Number(url.searchParams.get('isrRate')) : undefined,
      }),
    )
  }

  if (pathname === '/director/reports/monetization' && method === 'GET') {
    return json(buildMonetizationReport(url.searchParams.get('dateFrom'), url.searchParams.get('dateTo'), (url.searchParams.get('granularity') as 'day' | 'week' | 'month' | null) ?? 'month'))
  }
  if (pathname === '/director/reports/revenue' && method === 'GET') {
    const report = buildMonetizationReport(url.searchParams.get('dateFrom'), url.searchParams.get('dateTo'), (url.searchParams.get('granularity') as 'day' | 'week' | 'month' | null) ?? 'month')
    return json({ filters: report.filters, items: report.revenueByPeriod })
  }
  if (pathname === '/director/reports/revenue-by-plan' && method === 'GET') {
    const report = buildMonetizationReport(url.searchParams.get('dateFrom'), url.searchParams.get('dateTo'), 'month')
    return json({ filters: report.filters, items: report.revenueByPlan })
  }
  if (pathname === '/director/reports/accounts-receivable' && method === 'GET') {
    const report = buildMonetizationReport(url.searchParams.get('dateFrom'), url.searchParams.get('dateTo'), 'month')
    return json(report.ar)
  }
  if (pathname === '/director/reports/fees' && method === 'GET') {
    const report = buildMonetizationReport(url.searchParams.get('dateFrom'), url.searchParams.get('dateTo'), 'month')
    return json(report.fees)
  }

  if (pathname === '/director/revenue-dashboard' && method === 'GET') {
    const report = buildMonetizationReport(null, null, 'month')
    const nowMs = Date.now()
    const paidInvoices = monetization.invoices.filter((i) => i.status === 'paid')
    const activeSubs = monetization.subscriptions.filter((s) => s.status === 'active' || s.status === 'trialing')
    const mrrMxn = activeSubs.reduce((sum, sub) => {
      const plan = monetizationPlanById(sub.planId)
      if (!plan) return sum
      if (plan.billingPeriod === 'monthly') return sum + plan.priceMxn
      if (plan.billingPeriod === 'annual') return sum + Math.round(plan.priceMxn / 12)
      return sum
    }, 0)
    const arrMxn = mrrMxn * 12
    const revenueLast30DaysMxn = paidInvoices.filter((i) => i.paidAt && Date.parse(i.paidAt) >= nowMs - 30 * 24 * 3600_000).reduce((s, i) => s + i.totalMxn, 0)
    const revenueLast90DaysMxn = paidInvoices.filter((i) => i.paidAt && Date.parse(i.paidAt) >= nowMs - 90 * 24 * 3600_000).reduce((s, i) => s + i.totalMxn, 0)
    const canceledSubscriptions = monetization.subscriptions.filter((s) => s.status === 'canceled').length
    const churnProxy = monetization.subscriptions.length ? Number((canceledSubscriptions / monetization.subscriptions.length).toFixed(4)) : 0
    const totalPaymentAmount = monetization.payments.reduce((s, p) => s + p.amountMxn, 0)
    const totalFeesMxn = monetization.payments.reduce((s, p) => s + p.feeMxn, 0)
    const avgFeeRate = totalPaymentAmount ? Number((totalFeesMxn / totalPaymentAmount).toFixed(4)) : 0
    const planMix = monetization.plans.map((plan) => ({
      planId: plan.id,
      planName: plan.name,
      clubs: monetization.subscriptions.filter((s) => s.planId === plan.id).length,
      revenuePaidMxn: paidInvoices.filter((i) => (i.subscriptionId ? monetizationSubscriptionById(i.subscriptionId)?.planId === plan.id : false)).reduce((s, i) => s + i.totalMxn, 0),
    })).sort((a, b) => b.revenuePaidMxn - a.revenuePaidMxn)
    const alerts = [
      ...report.ar.items
        .filter((row) => row.dueAt && Date.parse(row.dueAt) < nowMs)
        .slice(0, 8)
        .map((row) => ({ id: `pastdue-${row.id}`, level: 'warning' as const, title: 'Factura vencida', description: `${row.id} por ${row.totalMxn / 100} MXN` })),
      ...(avgFeeRate >= 0.08 ? [{ id: 'fees-high', level: 'danger' as const, title: 'Comisiones altas', description: `Fee promedio ${(avgFeeRate * 100).toFixed(2)}%` }] : []),
    ]
    return json({
      kpis: {
        mrrMxn,
        arrMxn,
        revenueLast30DaysMxn,
        revenueLast90DaysMxn,
        arTotalsMxn: report.ar.summary.openTotalMxn,
        churnProxy,
        canceledSubscriptions,
      },
      planMix,
      feeSummary: { totalFeesMxn, avgFeeRate },
      alerts,
    })
  }

  const webhookMatch = pathname.match(/^\/payments\/webhook\/([^/]+)$/)
  if (webhookMatch && method === 'POST') {
    const provider = webhookMatch[1]
    if (!['manual', 'stripe', 'conekta', 'mercadopago', 'openpay'].includes(provider)) {
      return err('Provider no soportado.', 404)
    }

    const parsedProvider = provider as MonetizationPaymentProvider
    const providerRef = typeof body?.providerRef === 'string' ? body.providerRef.trim() : ''
    const invoiceId = typeof body?.invoiceId === 'string' ? body.invoiceId : ''
    const clubId = typeof body?.clubId === 'string' ? body.clubId : ''
    const amountMxn = body?.amountMxn == null ? null : Math.max(0, Number.parseInt(String(body.amountMxn), 10) || 0)
    const feeMxn = body?.feeMxn == null ? 0 : Math.max(0, Number.parseInt(String(body.feeMxn), 10) || 0)
    const status = ['pending', 'succeeded', 'failed', 'refunded'].includes(String(body?.status))
      ? (body?.status as MonetizationPaymentStatus)
      : 'pending'

    let payment = providerRef
      ? monetization.payments.find((p) => p.provider === parsedProvider && p.providerRef === providerRef) ?? null
      : null

    if (!payment && (!invoiceId || !clubId || amountMxn == null || amountMxn <= 0)) {
      return err('Webhook invalido.', 400)
    }

    if (!payment) {
      const invoice = monetizationInvoiceById(invoiceId)
      if (!invoice) return err('Factura no encontrada.', 404)
      const now = new Date().toISOString()
      payment = {
        id: nextMonetizationId('payment', 'paym-'),
        invoiceId,
        clubId,
        method: 'provider',
        provider: parsedProvider,
        providerRef: providerRef || null,
        amountMxn: amountMxn!,
        feeMxn,
        netMxn: amountMxn! - feeMxn,
        status,
        createdAt: now,
        updatedAt: now,
        metadata: body?.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata) ? (body.metadata as Record<string, unknown>) : { source: 'webhook_mock' },
      }
      monetization.payments.unshift(payment)
      if (payment.status === 'succeeded') {
        monetization.ledgerEntries.unshift(
          {
            id: nextMonetizationId('ledger', 'ledg-'),
            clubId: payment.clubId,
            type: 'revenue',
            category: 'invoice_payment',
            amountMxn: payment.amountMxn,
            referenceType: 'payment',
            referenceId: payment.id,
            occurredAt: payment.createdAt,
            notes: 'Webhook payment mock',
            metadata: {},
            createdAt: payment.createdAt,
          },
          ...(payment.feeMxn > 0
            ? [{
                id: nextMonetizationId('ledger', 'ledg-'),
                clubId: payment.clubId,
                type: 'fee' as const,
                category: 'payment_fee',
                amountMxn: -payment.feeMxn,
                referenceType: 'payment',
                referenceId: payment.id,
                occurredAt: payment.createdAt,
                notes: 'Webhook payment fee mock',
                metadata: {},
                createdAt: payment.createdAt,
              }]
            : []),
        )
      }
    }

    const invoice = payment ? recalcInvoiceStatusMock(payment.invoiceId) : null
    return json({
      ok: true,
      provider,
      adapterEnabled: provider === 'manual',
      message: 'mock webhook accepted',
      paymentId: payment?.id ?? null,
      invoiceId: invoice?.id ?? invoiceId ?? null,
    })
  }


  return null
}

function coreHandler(url: URL, method: string, body: Record<string, unknown> | null): Response {
  const pathname = url.pathname
  const directorMonetizationResponse = handleDirectorMonetizationRoutes(url, method, body)
  if (directorMonetizationResponse) return directorMonetizationResponse
  if (pathname === '/auth/login' && method === 'POST') {
    const username = typeof body?.username === 'string' ? body.username : 'manager.mock'
    const role = roleFrom(username)
    return json({ token: `mock-${role.toLowerCase()}-${Date.now()}`, userId: username, role })
  }
  if (pathname === '/auth/login-token' && method === 'POST') {
    const token = typeof body?.token === 'string' ? body.token : 'scanner.mock'
    const role = roleFrom(token) === 'MANAGER' ? 'SCANNER' : roleFrom(token)
    return json({ token: `mock-${role.toLowerCase()}-${Date.now()}`, userId: token, role })
  }
  if (pathname === '/director/landing-appointments' && method === 'GET') {
    const rows = [...state.landingAppointments].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    return json({ items: rows })
  }
  if (pathname === '/director/managers' && method === 'GET') {
    return json(state.managers.map(managerDto))
  }
  if (pathname === '/director/managers' && method === 'POST') {
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const username = typeof body?.username === 'string' ? body.username.trim().toLowerCase() : ''
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const clubIds = Array.isArray(body?.clubIds) ? body.clubIds.filter((item): item is string => typeof item === 'string') : []
    const active = typeof body?.active === 'boolean' ? body.active : true

    const subscriptionType = body?.subscriptionType
    const plan = body?.subscriptionPlan
    const subscriptionStatus = body?.subscriptionStatus
    const paymentStatus = body?.paymentStatus
    const billingCycle = body?.billingCycle
    const recurringAmount = Number(body?.recurringAmount)
    const perEventAmount = Number(body?.perEventAmount)
    const startsAt = typeof body?.subscriptionStartsAt === 'string' ? body.subscriptionStartsAt : new Date().toISOString()
    const renewsAt =
      typeof body?.subscriptionRenewsAt === 'string'
        ? body.subscriptionRenewsAt
        : body?.subscriptionRenewsAt === null
          ? null
          : null
    const billingNextDueAt =
      typeof body?.billingNextDueAt === 'string' ? body.billingNextDueAt : body?.billingNextDueAt === null ? null : renewsAt
    const billingLastPaidAt =
      typeof body?.billingLastPaidAt === 'string' ? body.billingLastPaidAt : body?.billingLastPaidAt === null ? null : null

    if (!name || !username || !email) return err('Nombre, usuario y email son obligatorios.', 400)
    if (state.managers.some((item) => item.user.username.toLowerCase() === username)) return err('El usuario manager ya existe.', 409)
    if (!['PER_EVENT', 'RECURRING'].includes(String(subscriptionType))) return err('Tipo de suscripcion invalido.', 400)
    if (!['BASIC', 'PRO', 'ENTERPRISE'].includes(String(plan))) return err('Plan de suscripcion invalido.', 400)
    if (!['TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELED'].includes(String(subscriptionStatus))) return err('Estado de suscripcion invalido.', 400)
    if (!['PAID', 'DUE_SOON', 'PENDING', 'PAST_DUE'].includes(String(paymentStatus))) return err('Estado de pago invalido.', 400)
    if (subscriptionType === 'RECURRING') {
      if (!['MONTHLY', 'ANNUAL'].includes(String(billingCycle))) return err('Ciclo de facturacion invalido.', 400)
      if (!Number.isFinite(recurringAmount) || recurringAmount < 0) return err('Monto recurrente invalido.', 400)
    }
    if (subscriptionType === 'PER_EVENT') {
      if (!Number.isFinite(perEventAmount) || perEventAmount < 0) return err('Precio por evento invalido.', 400)
    }
    if (clubIds.some((clubId) => !state.clubs.some((club) => club.id === clubId))) return err('Hay clubs invalidos en la asignacion.', 400)

    const subscription: ManagerSubscription =
      subscriptionType === 'RECURRING'
        ? {
            type: 'RECURRING',
            plan: plan as ManagerSubscriptionPlan,
            status: subscriptionStatus as ManagerSubscriptionStatus,
            billingCycle: billingCycle as BillingCycle,
            recurringAmount: Math.round(recurringAmount),
            startsAt,
            renewsAt,
          }
        : {
            type: 'PER_EVENT',
            plan: plan as ManagerSubscriptionPlan,
            status: subscriptionStatus as ManagerSubscriptionStatus,
            perEventAmount: Math.round(perEventAmount),
            startsAt,
            renewsAt,
          }

    const manager: ManagerAccount = {
      id: nextId('manager', 'mgr-'),
      active,
      user: { id: nextId('manager', 'usr-mgr-'), name, username, email },
      clubIds: Array.from(new Set(clubIds)),
      subscription,
      billing: {
        paymentStatus: paymentStatus as ManagerPaymentStatus,
        nextDueAt: billingNextDueAt,
        lastPaidAt: billingLastPaidAt,
        history: [],
      },
    }
    state.managers.push(manager)
    return json(managerDto(manager), 201)
  }
  const directorManagerMatch = pathname.match(/^\/director\/managers\/([^/]+)$/)
  if (directorManagerMatch && method === 'PATCH') {
    const manager = state.managers.find((item) => item.id === directorManagerMatch[1])
    if (!manager) return err('Manager no encontrado.', 404)

    if (typeof body?.name === 'string') manager.user.name = body.name.trim() || manager.user.name
    if (typeof body?.username === 'string') {
      const nextUsername = body.username.trim().toLowerCase()
      if (
        nextUsername &&
        state.managers.some((item) => item.id !== manager.id && item.user.username.toLowerCase() === nextUsername)
      ) {
        return err('El usuario manager ya existe.', 409)
      }
      manager.user.username = nextUsername || manager.user.username
    }
    if (typeof body?.email === 'string') manager.user.email = body.email.trim().toLowerCase() || manager.user.email
    if (typeof body?.active === 'boolean') manager.active = body.active

    if (Array.isArray(body?.clubIds)) {
      const clubIds = body.clubIds.filter((item): item is string => typeof item === 'string')
      if (clubIds.some((clubId) => !state.clubs.some((club) => club.id === clubId))) return err('Hay clubs invalidos en la asignacion.', 400)
      manager.clubIds = Array.from(new Set(clubIds))
    }

    const hasSubscriptionPatch =
      body?.subscriptionType !== undefined ||
      body?.subscriptionPlan !== undefined ||
      body?.subscriptionStatus !== undefined ||
      body?.billingCycle !== undefined ||
      body?.recurringAmount !== undefined ||
      body?.perEventAmount !== undefined ||
      body?.subscriptionStartsAt !== undefined ||
      body?.subscriptionRenewsAt !== undefined ||
      body?.paymentStatus !== undefined ||
      body?.billingNextDueAt !== undefined ||
      body?.billingLastPaidAt !== undefined

    if (hasSubscriptionPatch) {
      const nextType =
        typeof body?.subscriptionType === 'string' ? body.subscriptionType : (manager.subscription.type as ManagerSubscriptionType)
      if (!['PER_EVENT', 'RECURRING'].includes(String(nextType))) return err('Tipo de suscripcion invalido.', 400)

      const nextPlan =
        typeof body?.subscriptionPlan === 'string' ? body.subscriptionPlan : manager.subscription.plan
      if (!['BASIC', 'PRO', 'ENTERPRISE'].includes(String(nextPlan))) return err('Plan de suscripcion invalido.', 400)

      const nextStatus =
        typeof body?.subscriptionStatus === 'string' ? body.subscriptionStatus : manager.subscription.status
      if (!['TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELED'].includes(String(nextStatus))) return err('Estado de suscripcion invalido.', 400)

      const nextStartsAt =
        typeof body?.subscriptionStartsAt === 'string' ? body.subscriptionStartsAt : manager.subscription.startsAt
      const nextRenewsAt =
        typeof body?.subscriptionRenewsAt === 'string' || body?.subscriptionRenewsAt === null
          ? (body.subscriptionRenewsAt as string | null)
          : manager.subscription.renewsAt
      const nextPaymentStatus =
        typeof body?.paymentStatus === 'string' ? body.paymentStatus : manager.billing.paymentStatus
      if (!['PAID', 'DUE_SOON', 'PENDING', 'PAST_DUE'].includes(String(nextPaymentStatus))) return err('Estado de pago invalido.', 400)
      const nextBillingDueAt =
        typeof body?.billingNextDueAt === 'string' || body?.billingNextDueAt === null
          ? (body.billingNextDueAt as string | null)
          : manager.billing.nextDueAt
      const nextBillingLastPaidAt =
        typeof body?.billingLastPaidAt === 'string' || body?.billingLastPaidAt === null
          ? (body.billingLastPaidAt as string | null)
          : manager.billing.lastPaidAt

      if (nextType === 'RECURRING') {
        const nextBillingCycle =
          typeof body?.billingCycle === 'string'
            ? body.billingCycle
            : manager.subscription.type === 'RECURRING'
              ? manager.subscription.billingCycle
              : 'MONTHLY'
        if (!['MONTHLY', 'ANNUAL'].includes(String(nextBillingCycle))) return err('Ciclo de facturacion invalido.', 400)

        const nextRecurringAmount =
          body?.recurringAmount !== undefined
            ? Number(body.recurringAmount)
            : manager.subscription.type === 'RECURRING'
              ? manager.subscription.recurringAmount
              : 0
        if (!Number.isFinite(nextRecurringAmount) || nextRecurringAmount < 0) return err('Monto recurrente invalido.', 400)

        manager.subscription = {
          type: 'RECURRING',
          plan: nextPlan as ManagerSubscriptionPlan,
          status: nextStatus as ManagerSubscriptionStatus,
          billingCycle: nextBillingCycle as BillingCycle,
          recurringAmount: Math.round(nextRecurringAmount),
          startsAt: nextStartsAt,
          renewsAt: nextRenewsAt,
        }
      } else {
        const nextPerEventAmount =
          body?.perEventAmount !== undefined
            ? Number(body.perEventAmount)
            : manager.subscription.type === 'PER_EVENT'
              ? manager.subscription.perEventAmount
              : 0
        if (!Number.isFinite(nextPerEventAmount) || nextPerEventAmount < 0) return err('Precio por evento invalido.', 400)

        manager.subscription = {
          type: 'PER_EVENT',
          plan: nextPlan as ManagerSubscriptionPlan,
          status: nextStatus as ManagerSubscriptionStatus,
          perEventAmount: Math.round(nextPerEventAmount),
          startsAt: nextStartsAt,
          renewsAt: nextRenewsAt,
        }
      }

      manager.billing.paymentStatus = nextPaymentStatus as ManagerPaymentStatus
      manager.billing.nextDueAt = nextBillingDueAt
      manager.billing.lastPaidAt = nextBillingLastPaidAt
    }

    return json(managerDto(manager))
  }
  if (directorManagerMatch && method === 'DELETE') {
    const before = state.managers.length
    state.managers = state.managers.filter((item) => item.id !== directorManagerMatch[1])
    if (state.managers.length === before) return err('Manager no encontrado.', 404)
    return new Response(null, { status: 204 })
  }

  if (pathname === '/clubs' && method === 'GET') return json(state.clubs)
  if (pathname === '/clubs' && method === 'POST') {
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const capacity = Number(body?.capacity)
    if (!name || !Number.isFinite(capacity)) return err('Datos invalidos para club.', 400)
    const club: Club = { id: nextId('club', 'club-'), name, capacity: Math.max(1, Math.floor(capacity)), active: true }
    state.clubs.push(club)
    return json(club, 201)
  }
  const clubMatch = pathname.match(/^\/clubs\/([^/]+)$/)
  if (clubMatch && method === 'PATCH') {
    const club = state.clubs.find((item) => item.id === clubMatch[1])
    if (!club) return err('Club no encontrado.', 404)
    if (typeof body?.name === 'string') club.name = body.name.trim() || club.name
    if (typeof body?.capacity === 'number') club.capacity = Math.max(1, Math.floor(body.capacity))
    if (typeof body?.active === 'boolean') club.active = body.active
    return json(club)
  }
  if (clubMatch && method === 'DELETE') {
    const hasEvents = state.events.some((event) => event.clubId === clubMatch[1])
    if (hasEvents) return err('No puedes eliminar un club con eventos registrados.', 409)
    const before = state.clubs.length
    state.clubs = state.clubs.filter((item) => item.id !== clubMatch[1])
    if (state.clubs.length === before) return err('Club no encontrado.', 404)
    return new Response(null, { status: 204 })
  }

  if (pathname === '/events' && method === 'GET') return json(state.events.map((event) => eventDto(event)))
  if (pathname === '/events' && method === 'POST') {
    const clubId = typeof body?.clubId === 'string' ? body.clubId : ''
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const startsAt = typeof body?.startsAt === 'string' ? body.startsAt : ''
    const endsAt = typeof body?.endsAt === 'string' ? body.endsAt : ''
    if (!clubId || !name || !startsAt || !endsAt) return err('Datos invalidos para evento.', 400)
    if (!state.clubs.some((club) => club.id === clubId)) return err('Club no encontrado.', 404)
    const event: Event = {
      id: nextId('event', 'evt-'),
      name,
      startsAt,
      endsAt,
      active: true,
      clubId,
      templateImageUrl: null,
      qrPositionX: 0.5,
      qrPositionY: 0.5,
      qrSize: 0.35,
    }
    state.events.push(event)
    return json(eventDto(event), 201)
  }
  if (pathname === '/events/live' && method === 'GET') {
    const now = Date.now()
    const eventId = url.searchParams.get('eventId')
    const events = state.events
      .filter((event) => (eventId ? event.id === eventId : true))
      .map((event) => {
        const club = state.clubs.find((item) => item.id === event.clubId)
        const sent = state.tickets.filter((ticket) => ticket.eventId === event.id).length
        const scanned = state.tickets.filter((ticket) => ticket.eventId === event.id && ticket.status === 'SCANNED').length
        return {
          eventId: event.id,
          eventName: event.name,
          startsAt: event.startsAt,
          endsAt: event.endsAt,
          inProgress: event.active && Date.parse(event.startsAt) <= now && now <= Date.parse(event.endsAt),
          club: { id: club?.id ?? event.clubId, name: club?.name ?? 'Club', capacity: club?.capacity ?? 0 },
          sentAccesses: sent,
          scannedAccesses: scanned,
          pendingAccesses: Math.max(0, sent - scanned),
          occupancyPercent: club ? Math.min(100, Math.round((scanned / Math.max(1, club.capacity)) * 100)) : 0,
        }
      })
    return json({ filters: { eventId: eventId ?? null }, serverNow: new Date().toISOString(), events })
  }

  const eventTemplateMatch = pathname.match(/^\/events\/([^/]+)\/template$/)
  if (eventTemplateMatch && method === 'PUT') {
    const event = state.events.find((item) => item.id === eventTemplateMatch[1])
    if (!event) return err('Evento no encontrado.', 404)
    event.templateImageUrl = typeof body?.templateImageUrl === 'string' || body?.templateImageUrl === null ? (body.templateImageUrl as string | null) : event.templateImageUrl
    event.qrPositionX = typeof body?.qrPositionX === 'number' || body?.qrPositionX === null ? (body.qrPositionX as number | null) : event.qrPositionX
    event.qrPositionY = typeof body?.qrPositionY === 'number' || body?.qrPositionY === null ? (body.qrPositionY as number | null) : event.qrPositionY
    event.qrSize = typeof body?.qrSize === 'number' || body?.qrSize === null ? (body.qrSize as number | null) : event.qrSize
    return json(eventDto(event))
  }

  const eventMatch = pathname.match(/^\/events\/([^/]+)$/)
  if (eventMatch && method === 'PATCH') {
    const event = state.events.find((item) => item.id === eventMatch[1])
    if (!event) return err('Evento no encontrado.', 404)
    if (typeof body?.name === 'string') event.name = body.name.trim() || event.name
    if (typeof body?.startsAt === 'string') event.startsAt = body.startsAt
    if (typeof body?.endsAt === 'string') event.endsAt = body.endsAt
    if (typeof body?.active === 'boolean') event.active = body.active
    return json(eventDto(event))
  }

  if (pathname === '/rps' && method === 'GET') {
    const rows = state.rps.map((rp) => ({
      ...rp,
      assignments: state.assignments.filter((a) => a.rpId === rp.id).map((a) => {
        const event = state.events.find((item) => item.id === a.eventId)
        return {
          id: a.id,
          event: {
            id: event?.id ?? a.eventId,
            name: event?.name ?? 'Evento',
            startsAt: event?.startsAt ?? new Date().toISOString(),
            endsAt: event?.endsAt ?? new Date().toISOString(),
            active: event?.active ?? false,
          },
          limitAccesses: a.limitAccesses,
          usedAccesses: countTickets(a.eventId, a.rpId),
        }
      }),
    }))
    return json(rows)
  }
  if (pathname === '/rps' && method === 'POST') {
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const username = typeof body?.username === 'string' ? body.username.trim().toLowerCase() : ''
    if (!name || !username) return err('Datos invalidos para RP.', 400)
    if (state.rps.some((rp) => rp.user.username.toLowerCase() === username)) return err('El usuario RP ya existe.', 409)
    const rp: Rp = { id: nextId('rp', 'rp-'), active: true, user: { id: nextId('rp', 'usr-rp-'), name, username } }
    state.rps.push(rp)
    return json(rp, 201)
  }
  const rpMatch = pathname.match(/^\/rps\/([^/]+)$/)
  if (rpMatch && method === 'PATCH') {
    const rp = state.rps.find((item) => item.id === rpMatch[1])
    if (!rp) return err('RP no encontrado.', 404)
    if (typeof body?.name === 'string') rp.user.name = body.name.trim() || rp.user.name
    if (typeof body?.active === 'boolean') rp.active = body.active
    return json(rp)
  }

  if (pathname === '/scanners' && method === 'GET') return json(state.scanners)
  if (pathname === '/scanners' && method === 'POST') {
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const username = typeof body?.username === 'string' ? body.username.trim().toLowerCase() : ''
    if (!name || !username) return err('Datos invalidos para scanner.', 400)
    if (state.scanners.some((s) => s.user.username.toLowerCase() === username)) return err('El usuario scanner ya existe.', 409)
    const scanner: Scanner = {
      id: nextId('scanner', 'scanner-'),
      active: true,
      user: { id: nextId('scanner', 'usr-sc-'), name, username },
      lastScanAt: null,
    }
    state.scanners.push(scanner)
    return json(scanner, 201)
  }
  const scannerMatch = pathname.match(/^\/scanners\/([^/]+)$/)
  if (scannerMatch && method === 'PATCH') {
    const scanner = state.scanners.find((item) => item.id === scannerMatch[1])
    if (!scanner) return err('Scanner no encontrado.', 404)
    if (typeof body?.name === 'string') scanner.user.name = body.name.trim() || scanner.user.name
    if (typeof body?.active === 'boolean') scanner.active = body.active
    return json(scanner)
  }

  if (pathname === '/settings/guest-types/other-label' && method === 'GET') return json({ otherLabel: state.otherLabel })
  if (pathname === '/settings/guest-types/other-label' && method === 'PATCH') {
    const value = typeof body?.otherLabel === 'string' ? body.otherLabel.trim() : ''
    if (!value) return err('Etiqueta invalida.', 400)
    state.otherLabel = value
    return json({ otherLabel: state.otherLabel })
  }

  const eventRpGroupMatch = pathname.match(/^\/events\/([^/]+)\/rps$/)
  if (eventRpGroupMatch && method === 'POST') {
    const eventId = eventRpGroupMatch[1]
    if (!state.events.some((event) => event.id === eventId)) return err('Evento no encontrado.', 404)
    const rpId = typeof body?.rpId === 'string' ? body.rpId : ''
    const rp = state.rps.find((item) => item.id === rpId)
    if (!rp) return err('RP no encontrado.', 404)
    if (state.assignments.some((item) => item.eventId === eventId && item.rpId === rpId)) return err('El RP ya esta asignado.', 409)
    const assignment: Assignment = {
      id: nextId('assignment', 'asg-'),
      eventId,
      rpId,
      limitAccesses: typeof body?.limitAccesses === 'number' ? Math.max(0, Math.floor(body.limitAccesses)) : null,
    }
    state.assignments.push(assignment)
    return json({ ...assignment, usedAccesses: countTickets(eventId, rpId), rp }, 201)
  }
  const eventRpMatch = pathname.match(/^\/events\/([^/]+)\/rps\/([^/]+)$/)
  if (eventRpMatch && method === 'PATCH') {
    const assignment = state.assignments.find((item) => item.eventId === eventRpMatch[1] && item.rpId === eventRpMatch[2])
    if (!assignment) return err('Asignacion no encontrada.', 404)
    assignment.limitAccesses = typeof body?.limitAccesses === 'number' ? Math.max(0, Math.floor(body.limitAccesses)) : null
    const rp = state.rps.find((item) => item.id === assignment.rpId)
    return json({ ...assignment, usedAccesses: countTickets(assignment.eventId, assignment.rpId), rp })
  }
  if (eventRpMatch && method === 'DELETE') {
    const before = state.assignments.length
    state.assignments = state.assignments.filter((item) => !(item.eventId === eventRpMatch[1] && item.rpId === eventRpMatch[2]))
    if (state.assignments.length === before) return err('Asignacion no encontrada.', 404)
    return new Response(null, { status: 204 })
  }

  if (pathname === '/cuts' && method === 'GET') {
    const eventId = url.searchParams.get('eventId')
    const rpId = url.searchParams.get('rpId')
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')
    const agg = aggregateCuts({ eventId, rpId, from, to })
    return json({ filters: { eventId: eventId ?? null, rpId: rpId ?? null, from: from ?? null, to: to ?? null }, total: agg.total, totalGeneral: agg.totalGeneral, totalVip: agg.totalVip, totalOther: agg.totalOther, events: agg.events })
  }
  const cutDetailMatch = pathname.match(/^\/cuts\/([^/]+)\/rps\/([^/]+)$/)
  if (cutDetailMatch && method === 'GET') {
    const payload = managerCutDetailPayload(cutDetailMatch[1], cutDetailMatch[2], url.searchParams.get('from'), url.searchParams.get('to'))
    return payload ? json(payload) : err('No se encontro el detalle solicitado.', 404)
  }

  if (pathname === '/rp-groups' && method === 'GET') {
    return json(state.rpGroups.map((group) => ({ id: group.id, name: group.name, members: group.memberIds.map((id) => state.rps.find((rp) => rp.id === id)).filter(Boolean).map((rp) => ({ id: rp!.id, user: { name: rp!.user.name } })) })))
  }
  if (pathname === '/rp-groups' && method === 'POST') {
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    if (!name) return err('Nombre de grupo invalido.', 400)
    const memberIds = Array.isArray(body?.memberIds) ? body.memberIds.filter((item): item is string => typeof item === 'string') : []
    const group: RpGroup = { id: nextId('rpGroup', 'rpg-'), name, memberIds }
    state.rpGroups.push(group)
    return json({ id: group.id, name: group.name, members: group.memberIds.map((id) => state.rps.find((rp) => rp.id === id)).filter(Boolean).map((rp) => ({ id: rp!.id, user: { name: rp!.user.name } })) }, 201)
  }
  const rpGroupMatch = pathname.match(/^\/rp-groups\/([^/]+)$/)
  if (rpGroupMatch && method === 'PUT') {
    const group = state.rpGroups.find((item) => item.id === rpGroupMatch[1])
    if (!group) return err('Grupo no encontrado.', 404)
    if (typeof body?.name === 'string') group.name = body.name.trim() || group.name
    if (Array.isArray(body?.memberIds)) group.memberIds = body.memberIds.filter((item): item is string => typeof item === 'string')
    return json({ id: group.id, name: group.name, members: group.memberIds.map((id) => state.rps.find((rp) => rp.id === id)).filter(Boolean).map((rp) => ({ id: rp!.id, user: { name: rp!.user.name } })) })
  }
  if (rpGroupMatch && method === 'DELETE') {
    const before = state.rpGroups.length
    state.rpGroups = state.rpGroups.filter((item) => item.id !== rpGroupMatch[1])
    if (state.rpGroups.length === before) return err('Grupo no encontrado.', 404)
    return new Response(null, { status: 204 })
  }

  if (pathname === '/rp/events' && method === 'GET') {
    const rp = currentRp()
    return json({
      otherLabel: state.otherLabel,
      events: state.assignments
        .filter((a) => a.rpId === rp.id)
        .map((a) => {
          const event = state.events.find((item) => item.id === a.eventId)
          if (!event) return null
          const club = state.clubs.find((item) => item.id === event.clubId)
          const used = countTickets(a.eventId, a.rpId)
          return {
            assignmentId: a.id,
            eventId: event.id,
            eventName: event.name,
            clubName: club?.name ?? 'Club',
            startsAt: event.startsAt,
            endsAt: event.endsAt,
            limitAccesses: a.limitAccesses,
            usedAccesses: used,
            remainingAccesses: a.limitAccesses === null ? null : Math.max(a.limitAccesses - used, 0),
            guestTypeCounts: { GENERAL: countTickets(a.eventId, a.rpId, 'GENERAL'), VIP: countTickets(a.eventId, a.rpId, 'VIP'), OTHER: countTickets(a.eventId, a.rpId, 'OTHER') },
            eventActive: event.active,
          }
        })
        .filter(Boolean),
    })
  }
  if (pathname === '/tickets' && method === 'POST') {
    const eventId = typeof body?.eventId === 'string' ? body.eventId : ''
    const guestType = body?.guestType
    if (!eventId || (guestType !== 'GENERAL' && guestType !== 'VIP' && guestType !== 'OTHER')) return err('Payload invalido para generar ticket.', 400)
    const rp = currentRp()
    const assignment = state.assignments.find((a) => a.eventId === eventId && a.rpId === rp.id)
    if (!assignment) return err('No estas asignado a este evento.', 403)
    const event = state.events.find((item) => item.id === eventId)
    if (!event) return err('Evento no encontrado.', 404)
    const used = countTickets(eventId, rp.id)
    if (assignment.limitAccesses !== null && used >= assignment.limitAccesses) return err('No tienes accesos disponibles para este evento.', 409)
    const note = typeof body?.note === 'string' ? body.note.trim() : ''
    const ticket: Ticket = {
      id: `tkt-${state.seq.ticket}`,
      eventId,
      rpId: rp.id,
      guestType,
      note: note || null,
      createdAt: new Date().toISOString(),
      status: 'PENDING',
      scannedAt: null,
      scannerName: null,
      deliveryMethod: null,
      deliveryAt: null,
    }
    state.seq.ticket += 1
    state.tickets.unshift(ticket)
    const nextUsed = used + 1
    return json({
      id: ticket.id,
      guestType: ticket.guestType,
      note: ticket.note,
      status: ticket.status,
      event: { id: event.id, name: event.name, startsAt: event.startsAt, endsAt: event.endsAt },
      limitAccesses: assignment.limitAccesses,
      usedAccesses: nextUsed,
      remainingAccesses: assignment.limitAccesses === null ? null : Math.max(assignment.limitAccesses - nextUsed, 0),
    })
  }
  if (pathname === '/rp/tickets/history' && method === 'GET') {
    const rp = currentRp()
    const typeFilter = url.searchParams.get('guestType')
    const tickets = state.tickets
      .filter((t) => t.rpId === rp.id && (!typeFilter || t.guestType === typeFilter))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .map((t) => {
        const event = state.events.find((item) => item.id === t.eventId)
        return {
          id: t.id,
          guestType: t.guestType,
          displayLabel: t.guestType === 'OTHER' ? state.otherLabel : t.guestType,
          note: t.note,
          createdAt: t.createdAt,
          deliveryMethod: t.deliveryMethod,
          deliveryAt: t.deliveryAt,
          event: { id: t.eventId, name: event?.name ?? 'Evento', startsAt: event?.startsAt ?? new Date().toISOString(), active: event?.active ?? false },
        }
      })
    return json({ otherLabel: state.otherLabel, tickets })
  }
  const deliveryMatch = pathname.match(/^\/rp\/tickets\/([^/]+)\/delivery$/)
  if (deliveryMatch && method === 'POST') {
    const ticket = state.tickets.find((item) => item.id === deliveryMatch[1])
    if (!ticket) return err('Ticket no encontrado.', 404)
    const methodValue = body?.method
    if (methodValue !== 'WHATSAPP' && methodValue !== 'DOWNLOAD') return err('Metodo de envio invalido.', 400)
    const deliveredAt = new Date().toISOString()
    ticket.deliveryMethod = methodValue
    ticket.deliveryAt = deliveredAt
    return json({ ok: true, ticketId: ticket.id, method: methodValue, deliveredAt })
  }
  const ticketImageMatch = pathname.match(/^\/tickets\/([^/]+)\/png$/)
  if (ticketImageMatch && method === 'GET') {
    const ticket = state.tickets.find((item) => item.id === ticketImageMatch[1])
    if (!ticket) return err('Ticket no encontrado.', 404)
    return blob(ticketSvg(ticket.id))
  }

  return err(`Endpoint mock no soportado: ${method} ${pathname}`, 404)
}

function scannerHandler(url: URL, method: string, body: Record<string, unknown> | null): Response {
  const pathname = url.pathname
  if (pathname === '/scan/validate' && method === 'POST') {
    const token = typeof body?.qrToken === 'string' ? body.qrToken.trim() : ''
    if (!token) return err('Token QR invalido.', 400)
    const ticket = state.tickets.find((item) => item.id === token)
    if (!ticket) return json({ valid: false, reason: 'INVALID_TOKEN', ticket: null })
    const payload = {
      ticketId: ticket.id,
      eventId: ticket.eventId,
      guestType: ticket.guestType,
      displayLabel: ticket.guestType === 'OTHER' ? state.otherLabel : ticket.guestType,
      note: ticket.note,
      status: ticket.status,
      scannedAt: ticket.scannedAt,
    }
    if (ticket.status === 'SCANNED') return json({ valid: false, reason: 'ALREADY_SCANNED', ticket: payload })
    return json({ valid: true, reason: null, ticket: payload })
  }

  if (pathname === '/scan/confirm' && method === 'POST') {
    const token = typeof body?.qrToken === 'string' ? body.qrToken.trim() : ''
    if (!token) return err('Token QR invalido.', 400)
    const ticket = state.tickets.find((item) => item.id === token)
    if (!ticket) return json({ confirmed: false, reason: 'INVALID_TOKEN', ticket: null })
    const basePayload = {
      ticketId: ticket.id,
      eventId: ticket.eventId,
      guestType: ticket.guestType,
      displayLabel: ticket.guestType === 'OTHER' ? state.otherLabel : ticket.guestType,
      note: ticket.note,
      status: ticket.status,
      scannedAt: ticket.scannedAt,
    }
    if (ticket.status === 'SCANNED') return json({ confirmed: false, reason: 'ALREADY_SCANNED', ticket: basePayload })
    ticket.status = 'SCANNED'
    ticket.scannedAt = new Date().toISOString()
    ticket.scannerName = session()?.userId || 'scanner.mock'
    return json({ confirmed: true, reason: null, ticket: { ...basePayload, status: 'SCANNED', scannedAt: ticket.scannedAt } })
  }

  if (pathname === '/cuts' && method === 'GET') {
    const eventId = url.searchParams.get('eventId')
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')
    const limit = Math.max(1, Number.parseInt(url.searchParams.get('limit') ?? '20', 10) || 20)
    const offset = Math.max(0, Number.parseInt(url.searchParams.get('offset') ?? '0', 10) || 0)
    const agg = aggregateCuts({ eventId, from, to })
    const events = agg.events.slice(offset, offset + limit)
    const availableEvents = state.events.filter((event) => event.active).map((event) => ({ eventId: event.id, eventName: event.name }))
    return json({
      filters: { eventId: eventId ?? null, from: from ?? null, to: to ?? null },
      availableEvents,
      pagination: { totalEvents: agg.events.length, limit, offset, hasMore: offset + events.length < agg.events.length },
      total: agg.total,
      totalGeneral: agg.totalGeneral,
      totalVip: agg.totalVip,
      totalOther: agg.totalOther,
      events,
    })
  }

  const detailMatch = pathname.match(/^\/cuts\/([^/]+)\/rps\/([^/]+)$/)
  if (detailMatch && method === 'GET') {
    const payload = managerCutDetailPayload(detailMatch[1], detailMatch[2], url.searchParams.get('from'), url.searchParams.get('to'))
    if (!payload) return err('No se encontro el detalle solicitado.', 404)
    const limit = Math.max(1, Number.parseInt(url.searchParams.get('limit') ?? '50', 10) || 50)
    const offset = Math.max(0, Number.parseInt(url.searchParams.get('offset') ?? '0', 10) || 0)
    const scans = payload.scans.slice(offset, offset + limit)
    return json({ event: payload.event, rp: payload.rp, total: payload.total, pagination: { limit, offset, hasMore: offset + scans.length < payload.total }, scans })
  }

  return err(`Endpoint scanner mock no soportado: ${method} ${pathname}`, 404)
}

export function installMockBackend() {
  if (!enabled() || installed || typeof window === 'undefined') return
  installed = true
  const originalFetch = window.fetch.bind(window)
  const coreOrigin = new URL(appEnv.coreApiBaseUrl).origin
  const scannerOrigin = new URL(appEnv.scannerApiBaseUrl).origin

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const raw = input instanceof Request ? input.url : input.toString()
    const url = new URL(raw, window.location.origin)
    const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase()
    const body = parseBody(init)
    if (url.origin !== coreOrigin && url.origin !== scannerOrigin) return originalFetch(input, init)
    await new Promise((resolve) => window.setTimeout(resolve, 120))
    return url.origin === coreOrigin ? coreHandler(url, method, body) : scannerHandler(url, method, body)
  }

  console.info('[mock-backend] frontend mock enabled')
}
