export type InvoiceLineItemInput = {
  description: string
  qty: number
  unitPriceMxn: number
}

export type InvoiceTotals = {
  subtotalMxn: number
  taxMxn: number
  totalMxn: number
}

export type IsrBracket = {
  lowerLimitMxn?: number
  upToMxn?: number | null
  rate: number
  fixedFeeMxn?: number
}

export type FinanceTaxSettings = {
  vatRate?: number
  withholdingRate?: number
  isrMode?: 'none' | 'simple_rate' | 'brackets'
  isrRate?: number | null
  brackets?: IsrBracket[]
}

export type FinanceComputationInput = {
  paidInvoiceGrossIncomeMxn: number
  paidInvoiceNetIncomeMxn: number
  manualIncomeMxn: number
  expensesMxn: number
  expenseVatMxn: number
  collectedVatMxn: number
  incomeMode?: 'gross' | 'net'
  tax?: FinanceTaxSettings
}

export type FinanceComputationOutput = {
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

function clampInteger(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.round(value)
}

function clampRate(value: number | undefined, fallback = 0) {
  if (value === undefined || value === null || !Number.isFinite(value)) return fallback
  return Math.max(0, value)
}

export function normalizeInvoiceLineItems(items: InvoiceLineItemInput[]): InvoiceLineItemInput[] {
  return items
    .map((item) => ({
      description: item.description.trim(),
      qty: clampInteger(item.qty),
      unitPriceMxn: clampInteger(item.unitPriceMxn),
    }))
    .filter((item) => item.description.length > 0 && item.qty > 0)
}

export function calculateInvoiceTotalsFromLineItems(items: InvoiceLineItemInput[], taxRate = 0): InvoiceTotals {
  const normalized = normalizeInvoiceLineItems(items)
  const subtotalMxn = normalized.reduce((sum, item) => sum + item.qty * item.unitPriceMxn, 0)
  const appliedTaxRate = clampRate(taxRate, 0)
  const taxMxn = clampInteger(subtotalMxn * appliedTaxRate)
  return {
    subtotalMxn,
    taxMxn,
    totalMxn: subtotalMxn + taxMxn,
  }
}

function isObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function mergeEntitlements(planEntitlements: unknown, overrides: unknown): unknown {
  if (!isObjectLike(planEntitlements)) {
    return overrides ?? planEntitlements ?? {}
  }
  if (!isObjectLike(overrides)) {
    return overrides ?? planEntitlements
  }

  const result: Record<string, unknown> = { ...planEntitlements }
  for (const [key, value] of Object.entries(overrides)) {
    const baseValue = result[key]
    result[key] = isObjectLike(baseValue) && isObjectLike(value) ? mergeEntitlements(baseValue, value) : value
  }
  return result
}

export function computeIsrFromBrackets(taxableBaseMxn: number, brackets: IsrBracket[]): number {
  const taxable = Math.max(0, clampInteger(taxableBaseMxn))
  if (taxable <= 0 || brackets.length === 0) return 0

  const sorted = [...brackets].sort((a, b) => (a.lowerLimitMxn ?? 0) - (b.lowerLimitMxn ?? 0))

  for (const bracket of sorted) {
    const lower = Math.max(0, clampInteger(bracket.lowerLimitMxn ?? 0))
    const upper = bracket.upToMxn == null ? Number.POSITIVE_INFINITY : Math.max(lower, clampInteger(bracket.upToMxn))
    if (taxable < lower || taxable > upper) continue
    const rate = clampRate(bracket.rate)
    const fixedFeeMxn = clampInteger(bracket.fixedFeeMxn ?? 0)
    return Math.max(0, fixedFeeMxn + clampInteger((taxable - lower) * rate))
  }

  const last = sorted[sorted.length - 1]
  if (!last) return 0
  const lower = Math.max(0, clampInteger(last.lowerLimitMxn ?? 0))
  const fixedFeeMxn = clampInteger(last.fixedFeeMxn ?? 0)
  return Math.max(0, fixedFeeMxn + clampInteger((taxable - lower) * clampRate(last.rate)))
}

export function calculateFinanceSummary(input: FinanceComputationInput): FinanceComputationOutput {
  const vatRate = clampRate(input.tax?.vatRate, 0.16)
  const withholdingRate = clampRate(input.tax?.withholdingRate, 0)
  const grossInvoiceIncome = Math.max(0, clampInteger(input.paidInvoiceGrossIncomeMxn))
  const netInvoiceIncome = Math.max(0, clampInteger(input.paidInvoiceNetIncomeMxn))
  const manualIncomeMxn = Math.max(0, clampInteger(input.manualIncomeMxn))
  const expensesMxn = Math.max(0, clampInteger(input.expensesMxn))
  const expenseVatMxn = Math.max(0, clampInteger(input.expenseVatMxn))
  const collectedVatMxn =
    input.collectedVatMxn !== undefined ? Math.max(0, clampInteger(input.collectedVatMxn)) : clampInteger(grossInvoiceIncome * vatRate)

  const grossIncomeMxn = grossInvoiceIncome + manualIncomeMxn
  const netIncomeMxn = netInvoiceIncome + manualIncomeMxn
  const incomeBasisMxn = (input.incomeMode ?? 'gross') === 'net' ? netIncomeMxn : grossIncomeMxn
  const taxableBaseMxn = Math.max(0, incomeBasisMxn - expensesMxn)
  const vatPayableMxn = Math.max(0, collectedVatMxn - expenseVatMxn)
  const withholdingMxn = clampInteger(taxableBaseMxn * withholdingRate)

  let estimatedIsrMxn = 0
  const isrMode = input.tax?.isrMode ?? 'none'
  if (isrMode === 'simple_rate') {
    estimatedIsrMxn = clampInteger(taxableBaseMxn * clampRate(input.tax?.isrRate ?? 0, 0))
  } else if (isrMode === 'brackets') {
    estimatedIsrMxn = computeIsrFromBrackets(taxableBaseMxn, input.tax?.brackets ?? [])
  }

  const totalEstimatedTaxesMxn = vatPayableMxn + withholdingMxn + estimatedIsrMxn
  const profitAfterTaxesMxn = incomeBasisMxn - expensesMxn - totalEstimatedTaxesMxn
  const effectiveTaxRate = incomeBasisMxn > 0 ? Number((totalEstimatedTaxesMxn / incomeBasisMxn).toFixed(4)) : 0

  return {
    grossIncomeMxn,
    netIncomeMxn,
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
  }
}
