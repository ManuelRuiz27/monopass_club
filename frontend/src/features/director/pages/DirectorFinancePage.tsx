import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, PageErrorState, PageLoadingState } from '@/components/ui'
import { useToast } from '@/components/ToastProvider'
import { directorMonetizationApi, type DirectorLedgerEntryDTO, type DirectorLedgerEntryType } from '../monetizationApi'
import { dateInputToIso, downloadTextFile, formatDate, formatMxn, printHtml, toCsvRow } from '../monetizationUi'

function defaultPeriod() {
  const to = new Date()
  const from = new Date(Date.now() - 30 * 24 * 3600 * 1000)
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) }
}

export function DirectorFinancePage() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const defaults = useMemo(() => defaultPeriod(), [])
  const [dateFrom, setDateFrom] = useState(defaults.from)
  const [dateTo, setDateTo] = useState(defaults.to)
  const [incomeMode, setIncomeMode] = useState<'gross' | 'net'>('gross')
  const [presetId, setPresetId] = useState('')
  const [vatRate, setVatRate] = useState('0.16')
  const [withholdingRate, setWithholdingRate] = useState('0')
  const [isrMode, setIsrMode] = useState<'none' | 'simple_rate' | 'brackets'>('simple_rate')
  const [isrRate, setIsrRate] = useState('0.1')

  const [ledgerType, setLedgerType] = useState<DirectorLedgerEntryType>('expense')
  const [ledgerCategory, setLedgerCategory] = useState('infra')
  const [ledgerAmountMxn, setLedgerAmountMxn] = useState('-15000')
  const [ledgerOccurredAt, setLedgerOccurredAt] = useState(defaults.to)
  const [ledgerNotes, setLedgerNotes] = useState('')
  const [ledgerVatMxn, setLedgerVatMxn] = useState('0')

  const presetsQuery = useQuery({ queryKey: ['director', 'monetization', 'finance-presets'], queryFn: directorMonetizationApi.getFinancePresets })
  const ledgerQuery = useQuery({
    queryKey: ['director', 'monetization', 'ledger', { dateFrom, dateTo }],
    queryFn: () => directorMonetizationApi.getLedgerEntries({ dateFrom: dateInputToIso(dateFrom), dateTo: dateInputToIso(dateTo), page: 1, pageSize: 50 }),
  })
  const summaryQuery = useQuery({
    queryKey: ['director', 'monetization', 'finance-summary', { dateFrom, dateTo, incomeMode, presetId, vatRate, withholdingRate, isrMode, isrRate }],
    queryFn: () =>
      directorMonetizationApi.getFinanceSummary({
        dateFrom: dateInputToIso(dateFrom)!,
        dateTo: dateInputToIso(dateTo)!,
        incomeMode,
        presetId: presetId || undefined,
        vatRate: Number(vatRate),
        withholdingRate: Number(withholdingRate),
        isrMode,
        isrRate: isrMode === 'simple_rate' ? Number(isrRate) : undefined,
      }),
  })
  const reportQuery = useQuery({
    queryKey: ['director', 'monetization', 'finance-chart-report', { dateFrom, dateTo }],
    queryFn: () =>
      directorMonetizationApi.getMonetizationReport({
        dateFrom: dateInputToIso(dateFrom),
        dateTo: dateInputToIso(dateTo),
        granularity: 'week',
      }),
  })

  const createLedgerMutation = useMutation({
    mutationFn: async () =>
      directorMonetizationApi.createLedgerEntry({
        type: ledgerType,
        category: ledgerCategory.trim(),
        amountMxn: Number.parseInt(ledgerAmountMxn || '0', 10),
        occurredAt: dateInputToIso(ledgerOccurredAt) ?? new Date().toISOString(),
        notes: ledgerNotes.trim() || null,
        metadata: { vatMxn: Number.parseInt(ledgerVatMxn || '0', 10) || 0 },
      }),
    onSuccess: () => {
      toast.showToast({ title: 'Movimiento registrado', variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['director', 'monetization', 'ledger'] })
      queryClient.invalidateQueries({ queryKey: ['director', 'monetization', 'finance-summary'] })
    },
    onError: (error) => toast.showToast({ title: 'No se pudo registrar movimiento', description: error instanceof Error ? error.message : undefined, variant: 'error' }),
  })

  const deleteLedgerMutation = useMutation({
    mutationFn: (id: string) => directorMonetizationApi.deleteLedgerEntry(id),
    onSuccess: () => {
      toast.showToast({ title: 'Movimiento eliminado', variant: 'info' })
      queryClient.invalidateQueries({ queryKey: ['director', 'monetization', 'ledger'] })
      queryClient.invalidateQueries({ queryKey: ['director', 'monetization', 'finance-summary'] })
    },
  })

  const isLoading = presetsQuery.isLoading || summaryQuery.isLoading || ledgerQuery.isLoading || reportQuery.isLoading
  const error = presetsQuery.error || summaryQuery.error || ledgerQuery.error || reportQuery.error
  const presets = presetsQuery.data?.items ?? []
  const summary = summaryQuery.data
  const ledgerEntries = ledgerQuery.data?.items ?? []
  const chartSeries = reportQuery.data?.revenueByPeriod ?? []

  if (isLoading) return <PageLoadingState message="Calculando finanzas..." />
  if (error || !summary) return <PageErrorState description="No se pudo calcular el resumen financiero." />

  const exportSummaryJson = () =>
    downloadTextFile(summary.exportFiles.jsonFilename, JSON.stringify(summary, null, 2), 'application/json;charset=utf-8')
  const exportSummaryCsv = () =>
    downloadTextFile(summary.exportFiles.csvFilename, summary.exportFiles.csv, 'text/csv;charset=utf-8')
  const exportLedgerCsv = () => {
    const header = toCsvRow(['id', 'tipo', 'categoria', 'monto_mxn', 'fecha', 'notas'])
    const rows = ledgerEntries.map((row) => toCsvRow([row.id, row.type, row.category, row.amountMxn, row.occurredAt, row.notes ?? '']))
    downloadTextFile('director_ledger_entries.csv', [header, ...rows].join('\n'), 'text/csv;charset=utf-8')
  }
  const printSummary = () => {
    const r = summary.result
    printHtml(
      'Director Finance Summary',
      `<h1>Resumen financiero Director</h1>
      <p class="muted">Periodo: ${formatDate(summary.period.dateFrom)} a ${formatDate(summary.period.dateTo)}</p>
      <div class="grid">
        <div class="card"><strong>Ingresos brutos</strong><div>${formatMxn(r.grossIncomeMxn)}</div></div>
        <div class="card"><strong>Ingresos netos</strong><div>${formatMxn(r.netIncomeMxn)}</div></div>
        <div class="card"><strong>Gastos</strong><div>${formatMxn(r.expensesMxn)}</div></div>
        <div class="card"><strong>Base gravable</strong><div>${formatMxn(r.taxableBaseMxn)}</div></div>
        <div class="card"><strong>IVA a pagar</strong><div>${formatMxn(r.vatPayableMxn)}</div></div>
        <div class="card"><strong>ISR estimado</strong><div>${formatMxn(r.estimatedIsrMxn)}</div></div>
        <div class="card"><strong>Utilidad post impuestos</strong><div>${formatMxn(r.profitAfterTaxesMxn)}</div></div>
        <div class="card"><strong>Tasa efectiva</strong><div>${(r.effectiveTaxRate * 100).toFixed(2)}%</div></div>
      </div>`,
    )
  }

  const maxChart = Math.max(1, ...chartSeries.map((item) => item.totalMxn))

  return (
    <div className="director-page">
      <header className="director-page__header">
        <div>
          <h3 className="director-page__title">Monetizacion · Finanzas (MX)</h3>
          <p className="text-muted director-page__subtitle">Estimador interno configurable (no asesoria fiscal). Transparente y exportable.</p>
        </div>
      </header>

      <section className="card">
        <h4 className="director-section-title">Parametros del calculo</h4>
        <div className="form-grid">
          <label>Desde<input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></label>
          <label>Hasta<input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></label>
          <label>Preset
            <select value={presetId} onChange={(e) => setPresetId(e.target.value)}>
              <option value="">Sin preset</option>
              {presets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}
            </select>
          </label>
          <label>Base de ingreso
            <select value={incomeMode} onChange={(e) => setIncomeMode(e.target.value as 'gross' | 'net')}>
              <option value="gross">Gross</option>
              <option value="net">Net</option>
            </select>
          </label>
          <label>IVA rate<input value={vatRate} onChange={(e) => setVatRate(e.target.value)} /></label>
          <label>Retenciones<input value={withholdingRate} onChange={(e) => setWithholdingRate(e.target.value)} /></label>
          <label>ISR mode
            <select value={isrMode} onChange={(e) => setIsrMode(e.target.value as 'none' | 'simple_rate' | 'brackets')}>
              <option value="none">none</option>
              <option value="simple_rate">simple_rate</option>
              <option value="brackets">brackets</option>
            </select>
          </label>
          <label>ISR rate<input value={isrRate} onChange={(e) => setIsrRate(e.target.value)} disabled={isrMode !== 'simple_rate'} /></label>
        </div>
        <div className="director-managers-actions" style={{ marginTop: 12 }}>
          <Button type="button" variant="secondary" onClick={() => summaryQuery.refetch()}>Recalcular</Button>
          <Button type="button" variant="secondary" onClick={exportSummaryJson}>Exportar JSON</Button>
          <Button type="button" variant="secondary" onClick={exportSummaryCsv}>Exportar CSV</Button>
          <Button type="button" onClick={printSummary}>Imprimir resumen</Button>
        </div>
      </section>

      <section className="director-kpis">
        <article className="director-kpi director-kpi--flat"><p className="text-muted">Ingresos brutos</p><strong>{formatMxn(summary.result.grossIncomeMxn)}</strong></article>
        <article className="director-kpi director-kpi--flat"><p className="text-muted">Gastos</p><strong>{formatMxn(summary.result.expensesMxn)}</strong></article>
        <article className="director-kpi director-kpi--flat"><p className="text-muted">IVA a pagar</p><strong>{formatMxn(summary.result.vatPayableMxn)}</strong></article>
        <article className="director-kpi director-kpi--flat"><p className="text-muted">ISR estimado</p><strong>{formatMxn(summary.result.estimatedIsrMxn)}</strong></article>
        <article className="director-kpi director-kpi--flat"><p className="text-muted">Utilidad post impuestos</p><strong>{formatMxn(summary.result.profitAfterTaxesMxn)}</strong></article>
        <article className="director-kpi director-kpi--flat"><p className="text-muted">Tasa efectiva</p><strong>{(summary.result.effectiveTaxRate * 100).toFixed(2)}%</strong></article>
      </section>

      <section className="card">
        <h4 className="director-section-title">Tendencia de ingresos (simple)</h4>
        <div className="director-history-bars" role="img" aria-label="Ingresos por periodo">
          {chartSeries.map((item) => (
            <article key={item.period} className="director-history-bars__item">
              <div className="director-history-bars__group">
                <div className="director-history-bars__bar director-history-bars__bar--generated" style={{ height: `${Math.max(6, (item.totalMxn / maxChart) * 160)}px` }} />
              </div>
              <p className="text-muted director-history-bars__label">{item.period}</p>
              <p className="text-muted director-history-bars__meta">{formatMxn(item.totalMxn)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <h4 className="director-section-title">Movimientos manuales (ledger)</h4>
        <div className="form-grid">
          <label>Tipo
            <select value={ledgerType} onChange={(e) => setLedgerType(e.target.value as DirectorLedgerEntryType)}>
              <option value="expense">expense</option><option value="revenue">revenue</option><option value="adjustment">adjustment</option><option value="tax">tax</option>
            </select>
          </label>
          <label>Categoria<input value={ledgerCategory} onChange={(e) => setLedgerCategory(e.target.value)} /></label>
          <label>Monto (cents, signo incluido)<input type="number" value={ledgerAmountMxn} onChange={(e) => setLedgerAmountMxn(e.target.value)} /></label>
          <label>Fecha<input type="date" value={ledgerOccurredAt} onChange={(e) => setLedgerOccurredAt(e.target.value)} /></label>
          <label>IVA gasto (cents)<input type="number" value={ledgerVatMxn} onChange={(e) => setLedgerVatMxn(e.target.value)} /></label>
          <label style={{ gridColumn: '1 / -1' }}>Notas<input value={ledgerNotes} onChange={(e) => setLedgerNotes(e.target.value)} /></label>
        </div>
        <div className="director-managers-actions" style={{ marginTop: 12 }}>
          <Button type="button" loading={createLedgerMutation.isPending} onClick={() => createLedgerMutation.mutate()}>Registrar movimiento</Button>
          <Button type="button" variant="secondary" onClick={exportLedgerCsv}>Exportar ledger CSV</Button>
        </div>

        <div className="director-table-wrap" style={{ marginTop: 12 }}>
          <table className="director-table">
            <thead><tr><th>Fecha</th><th>Tipo</th><th>Categoria</th><th>Monto</th><th>Notas</th><th>Acciones</th></tr></thead>
            <tbody>
              {ledgerEntries.map((row: DirectorLedgerEntryDTO) => (
                <tr key={row.id}>
                  <td>{formatDate(row.occurredAt)}</td>
                  <td>{row.type}</td>
                  <td>{row.category}</td>
                  <td>{formatMxn(row.amountMxn)}</td>
                  <td>{row.notes ?? '—'}</td>
                  <td><Button type="button" size="sm" variant="ghost" loading={deleteLedgerMutation.isPending} onClick={() => deleteLedgerMutation.mutate(row.id)}>Eliminar</Button></td>
                </tr>
              ))}
              {ledgerEntries.length === 0 ? (
                <tr><td colSpan={6}><p className="text-muted">No hay movimientos manuales en el periodo.</p></td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
