import { coreHttpClient } from '@/lib/httpClient'

export type DirectorMonetizationClubDTO = {
  id: string
  name: string
  active: boolean
  capacity: number
  managerId: string
}

export type DirectorSubscriptionPlanStatus = 'active' | 'archived'
export type DirectorBillingPeriod = 'monthly' | 'annual' | 'one_time'

export type DirectorPlanDTO = {
  id: string
  name: string
  description: string | null
  billingPeriod: DirectorBillingPeriod
  priceMxn: number
  currency: string
  includedEventsPerMonth: number | null
  entitlements: Record<string, unknown>
  overagePricePerEventMxn: number | null
  status: DirectorSubscriptionPlanStatus
  createdAt: string
  updatedAt: string
}

export type PaginatedResponse<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export type DirectorSubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'paused'

export type DirectorSubscriptionDTO = {
  id: string
  clubId: string
  planId: string
  status: DirectorSubscriptionStatus
  startAt: string
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  trialEndAt: string | null
  seatsHostsLimit: number | null
  metadata: Record<string, unknown>
  overrides: Record<string, unknown>
  effectiveEntitlements: Record<string, unknown>
  createdAt: string
  updatedAt: string
  club: DirectorMonetizationClubDTO
  plan: DirectorPlanDTO
}

export type DirectorInvoiceStatus = 'draft' | 'issued' | 'paid' | 'void'
export type DirectorInvoiceType = 'subscription' | 'topup' | 'manual_adjustment'
export type DirectorPaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded'
export type DirectorPaymentMethod = 'cash' | 'transfer' | 'card' | 'provider'
export type DirectorPaymentProvider = 'manual' | 'stripe' | 'conekta' | 'mercadopago' | 'openpay'

export type DirectorPaymentDTO = {
  id: string
  invoiceId: string
  clubId: string
  method: DirectorPaymentMethod
  provider: DirectorPaymentProvider | null
  providerRef: string | null
  amountMxn: number
  feeMxn: number
  netMxn: number
  status: DirectorPaymentStatus
  createdAt: string
  updatedAt: string
  refundedAt?: string | null
  metadata?: Record<string, unknown> | null
}

export type DirectorInvoiceDTO = {
  id: string
  clubId: string
  subscriptionId: string | null
  type: DirectorInvoiceType
  subtotalMxn: number
  taxMxn: number
  totalMxn: number
  status: DirectorInvoiceStatus
  issuedAt: string | null
  dueAt: string | null
  paidAt: string | null
  items: Array<{ description: string; qty: number; unit_price_mxn: number; line_total_mxn: number }>
  notes: string | null
  createdAt: string
  updatedAt: string
  club?: DirectorMonetizationClubDTO
  subscription?: (DirectorSubscriptionDTO & { plan?: DirectorPlanDTO }) | null
  payments?: DirectorPaymentDTO[]
}

export type DirectorLedgerEntryType = 'revenue' | 'expense' | 'tax' | 'refund' | 'fee' | 'adjustment'

export type DirectorLedgerEntryDTO = {
  id: string
  clubId: string | null
  type: DirectorLedgerEntryType
  category: string
  amountMxn: number
  referenceType: string | null
  referenceId: string | null
  occurredAt: string
  notes: string | null
  metadata?: Record<string, unknown> | null
  createdAt: string
}

export type DirectorFinancePresetDTO = {
  id: string
  directorUserId: string
  name: string
  vatRate: number
  isrMode: 'none' | 'simple_rate' | 'brackets'
  isrRate: number | null
  bracketsJson: Array<{ lowerLimitMxn?: number; upToMxn?: number | null; rate: number; fixedFeeMxn?: number }>
  defaultExpenseCategories: string[]
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type DirectorFinanceSummaryDTO = {
  period: { dateFrom: string; dateTo: string }
  settings: {
    presetId: string | null
    incomeMode: 'gross' | 'net'
    vatRate: number
    withholdingRate: number
    isrMode: 'none' | 'simple_rate' | 'brackets'
    isrRate: number | null
    brackets: Array<{ lowerLimitMxn?: number; upToMxn?: number | null; rate: number; fixedFeeMxn?: number }>
  }
  inputs: Record<string, number>
  result: {
    grossIncomeMxn: number
    netIncomeMxn: number
    expensesMxn: number
    taxableBaseMxn: number
    vatCollectedMxn: number
    vatPaidMxn: number
    vatPayableMxn: number
    withholdingMxn: number
    estimatedIsrMxn: number
    totalEstimatedTaxesMxn: number
    profitAfterTaxesMxn: number
    effectiveTaxRate: number
  }
  exportFiles: {
    jsonFilename: string
    csvFilename: string
    csv: string
  }
}

export type DirectorMonetizationReportDTO = {
  filters: { dateFrom: string; dateTo: string; granularity: 'day' | 'week' | 'month' }
  revenueByPeriod: Array<{ period: string; totalMxn: number; invoices: number }>
  revenueByPlan: Array<{ planId: string; planName: string; totalMxn: number; invoices: number }>
  ar: {
    items: DirectorInvoiceDTO[]
    summary: {
      openCount: number
      openTotalMxn: number
      pastDueCount: number
      pastDueTotalMxn: number
    }
  }
  fees: {
    totalFeesMxn: number
    totalGrossMxn: number
    totalRefundsMxn: number
    abnormal: Array<{ paymentId: string; invoiceId: string; amountMxn: number; feeMxn: number; feeRate: number }>
  }
}

export type DirectorRevenueDashboardDTO = {
  kpis: {
    mrrMxn: number
    arrMxn: number
    revenueLast30DaysMxn: number
    revenueLast90DaysMxn: number
    arTotalsMxn: number
    churnProxy: number
    canceledSubscriptions: number
  }
  planMix: Array<{ planId: string; planName: string; clubs: number; revenuePaidMxn: number }>
  feeSummary: { totalFeesMxn: number; avgFeeRate: number }
  alerts: Array<{ id: string; level: 'warning' | 'danger'; title: string; description: string }>
}

export const directorMonetizationApi = {
  getClubs: () => coreHttpClient.get<DirectorMonetizationClubDTO[]>('/director/clubs'),
  getPlans: (params?: { status?: DirectorSubscriptionPlanStatus; q?: string; page?: number; pageSize?: number }) =>
    coreHttpClient.get<PaginatedResponse<DirectorPlanDTO>>('/director/plans', { query: params }),
  createPlan: (payload: Omit<DirectorPlanDTO, 'id' | 'createdAt' | 'updatedAt'>) =>
    coreHttpClient.post<DirectorPlanDTO>('/director/plans', payload),
  updatePlan: (id: string, payload: Partial<Omit<DirectorPlanDTO, 'id' | 'createdAt' | 'updatedAt'>>) =>
    coreHttpClient.patch<DirectorPlanDTO>(`/director/plans/${id}`, payload),
  archivePlan: (id: string) => coreHttpClient.delete<void>(`/director/plans/${id}`),

  getSubscriptions: (params?: {
    status?: DirectorSubscriptionStatus
    clubId?: string
    planId?: string
    q?: string
    page?: number
    pageSize?: number
  }) => coreHttpClient.get<PaginatedResponse<DirectorSubscriptionDTO>>('/director/subscriptions', { query: params }),
  createSubscription: (payload: {
    clubId: string
    planId: string
    status: DirectorSubscriptionStatus
    startAt: string
    currentPeriodStart: string
    currentPeriodEnd: string
    cancelAtPeriodEnd?: boolean
    trialEndAt?: string | null
    seatsHostsLimit?: number | null
    metadata?: Record<string, unknown>
    overrides?: Record<string, unknown>
  }) => coreHttpClient.post<DirectorSubscriptionDTO>('/director/subscriptions', payload),
  updateSubscription: (
    id: string,
    payload: Partial<{
      planId: string
      status: DirectorSubscriptionStatus
      currentPeriodStart: string
      currentPeriodEnd: string
      cancelAtPeriodEnd: boolean
      trialEndAt: string | null
      seatsHostsLimit: number | null
      metadata: Record<string, unknown>
      overrides: Record<string, unknown>
    }>,
  ) => coreHttpClient.patch<DirectorSubscriptionDTO>(`/director/subscriptions/${id}`, payload),

  getInvoices: (params?: { status?: DirectorInvoiceStatus; clubId?: string; dateFrom?: string; dateTo?: string; page?: number; pageSize?: number }) =>
    coreHttpClient.get<PaginatedResponse<DirectorInvoiceDTO> & { summary: { pastDueCount: number; openCount: number } }>('/director/invoices', { query: params }),
  getInvoice: (id: string) => coreHttpClient.get<DirectorInvoiceDTO>(`/director/invoices/${id}`),
  createInvoice: (payload: {
    clubId: string
    subscriptionId?: string | null
    type: DirectorInvoiceType
    items: Array<{ description: string; qty: number; unitPriceMxn: number }>
    taxRate?: number
    status?: DirectorInvoiceStatus
    issuedAt?: string | null
    dueAt?: string | null
    notes?: string | null
  }) => coreHttpClient.post<DirectorInvoiceDTO>('/director/invoices', payload),
  createInvoicePayment: (
    invoiceId: string,
    payload: {
      method: DirectorPaymentMethod
      provider?: DirectorPaymentProvider | null
      providerRef?: string | null
      amountMxn: number
      feeMxn?: number
      status?: DirectorPaymentStatus
      createdAt?: string | null
      metadata?: Record<string, unknown>
    },
  ) => coreHttpClient.post<{ payment: DirectorPaymentDTO; invoice: DirectorInvoiceDTO; idempotent: boolean }>(`/director/invoices/${invoiceId}/payments`, payload),
  refundPayment: (paymentId: string, payload?: { amountMxn?: number; reason?: string | null }) =>
    coreHttpClient.post<{ payment: DirectorPaymentDTO; invoice: DirectorInvoiceDTO }>(`/director/payments/${paymentId}/refund`, payload),

  getLedgerEntries: (params?: { dateFrom?: string; dateTo?: string; clubId?: string; type?: DirectorLedgerEntryType; page?: number; pageSize?: number }) =>
    coreHttpClient.get<PaginatedResponse<DirectorLedgerEntryDTO>>('/director/ledger-entries', { query: params }),
  createLedgerEntry: (payload: {
    clubId?: string | null
    type: DirectorLedgerEntryType
    category: string
    amountMxn: number
    occurredAt: string
    notes?: string | null
    referenceType?: string | null
    referenceId?: string | null
    metadata?: Record<string, unknown>
  }) => coreHttpClient.post<DirectorLedgerEntryDTO>('/director/ledger-entries', payload),
  updateLedgerEntry: (id: string, payload: Partial<{
    clubId: string | null
    type: DirectorLedgerEntryType
    category: string
    amountMxn: number
    occurredAt: string
    notes: string | null
    referenceType: string | null
    referenceId: string | null
    metadata: Record<string, unknown>
  }>) => coreHttpClient.patch<DirectorLedgerEntryDTO>(`/director/ledger-entries/${id}`, payload),
  deleteLedgerEntry: (id: string) => coreHttpClient.delete<void>(`/director/ledger-entries/${id}`),

  getFinancePresets: () => coreHttpClient.get<{ items: DirectorFinancePresetDTO[] }>('/director/finance-presets'),
  getFinancePreset: (id: string) => coreHttpClient.get<DirectorFinancePresetDTO>(`/director/finance-presets/${id}`),
  createFinancePreset: (payload: Omit<DirectorFinancePresetDTO, 'id' | 'directorUserId' | 'createdAt' | 'updatedAt'>) =>
    coreHttpClient.post<DirectorFinancePresetDTO>('/director/finance-presets', payload),
  updateFinancePreset: (
    id: string,
    payload: Partial<Omit<DirectorFinancePresetDTO, 'id' | 'directorUserId' | 'createdAt' | 'updatedAt'>>,
  ) => coreHttpClient.patch<DirectorFinancePresetDTO>(`/director/finance-presets/${id}`, payload),
  deleteFinancePreset: (id: string) => coreHttpClient.delete<void>(`/director/finance-presets/${id}`),

  getFinanceSummary: (params: {
    dateFrom: string
    dateTo: string
    presetId?: string
    incomeMode?: 'gross' | 'net'
    vatRate?: number
    withholdingRate?: number
    isrMode?: 'none' | 'simple_rate' | 'brackets'
    isrRate?: number
    bracketsJson?: string
  }) => coreHttpClient.get<DirectorFinanceSummaryDTO>('/director/finance/summary', { query: params }),
  getMonetizationReport: (params?: { dateFrom?: string; dateTo?: string; granularity?: 'day' | 'week' | 'month' }) =>
    coreHttpClient.get<DirectorMonetizationReportDTO>('/director/reports/monetization', { query: params }),
  getRevenueByPeriodReport: (params?: { dateFrom?: string; dateTo?: string; granularity?: 'day' | 'week' | 'month' }) =>
    coreHttpClient.get<{ filters: DirectorMonetizationReportDTO['filters']; items: DirectorMonetizationReportDTO['revenueByPeriod'] }>(
      '/director/reports/revenue',
      { query: params },
    ),
  getRevenueByPlanReport: (params?: { dateFrom?: string; dateTo?: string }) =>
    coreHttpClient.get<{ filters: Pick<DirectorMonetizationReportDTO['filters'], 'dateFrom' | 'dateTo'> & { granularity: 'month' }; items: DirectorMonetizationReportDTO['revenueByPlan'] }>(
      '/director/reports/revenue-by-plan',
      { query: params },
    ),
  getAccountsReceivableReport: (params?: { dateFrom?: string; dateTo?: string }) =>
    coreHttpClient.get<DirectorMonetizationReportDTO['ar']>('/director/reports/accounts-receivable', { query: params }),
  getFeesReport: (params?: { dateFrom?: string; dateTo?: string }) =>
    coreHttpClient.get<DirectorMonetizationReportDTO['fees']>('/director/reports/fees', { query: params }),
  getRevenueDashboard: () => coreHttpClient.get<DirectorRevenueDashboardDTO>('/director/revenue-dashboard'),
}
