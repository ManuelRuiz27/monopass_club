import { describe, expect, it } from 'vitest'
import { calculateFinanceSummary, calculateInvoiceTotalsFromLineItems, computeIsrFromBrackets } from './calculations'

describe('director monetization calculations', () => {
  it('calculates invoice totals from line items with VAT', () => {
    const totals = calculateInvoiceTotalsFromLineItems(
      [
        { description: 'Plan mensual', qty: 1, unitPriceMxn: 10000 },
        { description: 'Evento extra', qty: 2, unitPriceMxn: 2500 },
      ],
      0.16,
    )

    expect(totals.subtotalMxn).toBe(15000)
    expect(totals.taxMxn).toBe(2400)
    expect(totals.totalMxn).toBe(17400)
  })

  it('computes finance summary (VAT, taxable base, profit after taxes) with simple ISR rate', () => {
    const summary = calculateFinanceSummary({
      paidInvoiceGrossIncomeMxn: 100000,
      paidInvoiceNetIncomeMxn: 92000,
      manualIncomeMxn: 5000,
      expensesMxn: 30000,
      expenseVatMxn: 2400,
      collectedVatMxn: 16000,
      incomeMode: 'gross',
      tax: {
        vatRate: 0.16,
        withholdingRate: 0.02,
        isrMode: 'simple_rate',
        isrRate: 0.1,
      },
    })

    expect(summary.grossIncomeMxn).toBe(105000)
    expect(summary.taxableBaseMxn).toBe(75000)
    expect(summary.vatPayableMxn).toBe(13600)
    expect(summary.withholdingMxn).toBe(1500)
    expect(summary.estimatedIsrMxn).toBe(7500)
    expect(summary.totalEstimatedTaxesMxn).toBe(22600)
    expect(summary.profitAfterTaxesMxn).toBe(52400)
  })

  it('computes ISR using configured brackets', () => {
    const isr = computeIsrFromBrackets(30000, [
      { lowerLimitMxn: 0, upToMxn: 10000, rate: 0.05, fixedFeeMxn: 0 },
      { lowerLimitMxn: 10001, upToMxn: 20000, rate: 0.1, fixedFeeMxn: 500 },
      { lowerLimitMxn: 20001, upToMxn: null, rate: 0.2, fixedFeeMxn: 1500 },
    ])

    expect(isr).toBe(3500)
  })
})
