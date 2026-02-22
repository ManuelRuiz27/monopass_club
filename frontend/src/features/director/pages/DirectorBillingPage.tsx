import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, CardEmptyState, PageErrorState, PageLoadingState } from '@/components/ui'
import { useToast } from '@/components/ToastProvider'
import { directorMonetizationApi, type DirectorInvoiceStatus, type DirectorInvoiceType, type DirectorPaymentMethod } from '../monetizationApi'
import { dateInputToIso, formatDate, formatMxn } from '../monetizationUi'

type InvoiceDraftLine = { description: string; qty: string; unitPriceMxn: string }

function blankLine(): InvoiceDraftLine {
  return { description: '', qty: '1', unitPriceMxn: '0' }
}

export function DirectorBillingPage() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<'all' | DirectorInvoiceStatus>('all')
  const [clubIdFilter, setClubIdFilter] = useState('')
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)

  const [newInvoiceClubId, setNewInvoiceClubId] = useState('')
  const [newInvoiceSubscriptionId, setNewInvoiceSubscriptionId] = useState('')
  const [newInvoiceType, setNewInvoiceType] = useState<DirectorInvoiceType>('subscription')
  const [newInvoiceTaxRate, setNewInvoiceTaxRate] = useState('0.16')
  const [newInvoiceDueAt, setNewInvoiceDueAt] = useState('')
  const [newInvoiceNotes, setNewInvoiceNotes] = useState('')
  const [lines, setLines] = useState<InvoiceDraftLine[]>([{ description: 'Suscripcion mensual', qty: '1', unitPriceMxn: '149900' }])

  const [paymentMethod, setPaymentMethod] = useState<DirectorPaymentMethod>('transfer')
  const [paymentAmountMxn, setPaymentAmountMxn] = useState('')
  const [paymentFeeMxn, setPaymentFeeMxn] = useState('0')
  const [paymentProviderRef, setPaymentProviderRef] = useState('')

  const clubsQuery = useQuery({ queryKey: ['director', 'monetization', 'clubs'], queryFn: directorMonetizationApi.getClubs })
  const subscriptionsQuery = useQuery({ queryKey: ['director', 'monetization', 'subs-all-billing'], queryFn: () => directorMonetizationApi.getSubscriptions({ page: 1, pageSize: 100 }) })
  const invoicesQuery = useQuery({
    queryKey: ['director', 'monetization', 'invoices', { page, status, clubIdFilter }],
    queryFn: () =>
      directorMonetizationApi.getInvoices({
        page,
        pageSize: 10,
        status: status === 'all' ? undefined : status,
        clubId: clubIdFilter || undefined,
      }),
  })
  const reportQuery = useQuery({
    queryKey: ['director', 'monetization', 'report-lite'],
    queryFn: () => directorMonetizationApi.getMonetizationReport({ granularity: 'month' }),
  })

  const selectedInvoice = useMemo(
    () => invoicesQuery.data?.items.find((item) => item.id === selectedInvoiceId) ?? null,
    [invoicesQuery.data?.items, selectedInvoiceId],
  )

  const createInvoiceMutation = useMutation({
    mutationFn: async () => {
      const parsedItems = lines
        .map((line) => ({
          description: line.description.trim(),
          qty: Number.parseInt(line.qty || '0', 10),
          unitPriceMxn: Number.parseInt(line.unitPriceMxn || '0', 10),
        }))
        .filter((line) => line.description && Number.isFinite(line.qty) && line.qty > 0 && Number.isFinite(line.unitPriceMxn))
      if (!newInvoiceClubId) throw new Error('Selecciona un club.')
      if (parsedItems.length === 0) throw new Error('Agrega al menos un concepto valido.')
      return directorMonetizationApi.createInvoice({
        clubId: newInvoiceClubId,
        subscriptionId: newInvoiceSubscriptionId || null,
        type: newInvoiceType,
        items: parsedItems,
        taxRate: Number(newInvoiceTaxRate),
        dueAt: dateInputToIso(newInvoiceDueAt) ?? null,
        notes: newInvoiceNotes.trim() || null,
      })
    },
    onSuccess: (invoice) => {
      toast.showToast({ title: 'Factura creada', variant: 'success' })
      setSelectedInvoiceId(invoice.id)
      queryClient.invalidateQueries({ queryKey: ['director', 'monetization', 'invoices'] })
      queryClient.invalidateQueries({ queryKey: ['director', 'monetization', 'report-lite'] })
    },
    onError: (error) => toast.showToast({ title: 'No se pudo crear factura', description: error instanceof Error ? error.message : undefined, variant: 'error' }),
  })

  const paymentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedInvoice) throw new Error('Selecciona una factura.')
      const amountMxn = Number.parseInt(paymentAmountMxn || '0', 10)
      if (!Number.isFinite(amountMxn) || amountMxn <= 0) throw new Error('Monto de pago invalido.')
      return directorMonetizationApi.createInvoicePayment(selectedInvoice.id, {
        method: paymentMethod,
        amountMxn,
        feeMxn: Number.parseInt(paymentFeeMxn || '0', 10) || 0,
        providerRef: paymentProviderRef.trim() || null,
      })
    },
    onSuccess: () => {
      toast.showToast({ title: 'Pago registrado', variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['director', 'monetization', 'invoices'] })
      queryClient.invalidateQueries({ queryKey: ['director', 'monetization', 'report-lite'] })
      queryClient.invalidateQueries({ queryKey: ['director', 'monetization', 'dashboard'] })
      setPaymentProviderRef('')
      setPaymentFeeMxn('0')
    },
    onError: (error) => toast.showToast({ title: 'No se pudo registrar pago', description: error instanceof Error ? error.message : undefined, variant: 'error' }),
  })

  const refundMutation = useMutation({
    mutationFn: async (paymentId: string) => directorMonetizationApi.refundPayment(paymentId, { reason: 'Refund manual director' }),
    onSuccess: () => {
      toast.showToast({ title: 'Refund registrado', variant: 'info' })
      queryClient.invalidateQueries({ queryKey: ['director', 'monetization', 'invoices'] })
      queryClient.invalidateQueries({ queryKey: ['director', 'monetization', 'report-lite'] })
      queryClient.invalidateQueries({ queryKey: ['director', 'monetization', 'dashboard'] })
    },
    onError: (error) => toast.showToast({ title: 'No se pudo hacer refund', description: error instanceof Error ? error.message : undefined, variant: 'error' }),
  })

  const isLoading = clubsQuery.isLoading || subscriptionsQuery.isLoading || invoicesQuery.isLoading || reportQuery.isLoading
  const error = clubsQuery.error || subscriptionsQuery.error || invoicesQuery.error || reportQuery.error
  const clubs = clubsQuery.data ?? []
  const subscriptions = subscriptionsQuery.data?.items ?? []
  const invoices = invoicesQuery.data?.items ?? []
  const invoiceSummary = invoicesQuery.data?.summary
  const report = reportQuery.data
  const totalPages = Math.max(1, Math.ceil((invoicesQuery.data?.total ?? 0) / 10))

  if (isLoading) return <PageLoadingState message="Cargando facturacion..." />
  if (error) return <PageErrorState description="No se pudo cargar la facturacion." />

  return (
    <div className="director-page">
      <header className="director-page__header">
        <div>
          <h3 className="director-page__title">Monetizacion · Billing</h3>
          <p className="text-muted director-page__subtitle">Facturas, pagos manuales/proveedor y refunds con alertas de cartera y fees.</p>
        </div>
      </header>

      <section className="director-kpis">
        <article className="director-kpi director-kpi--flat"><p className="text-muted">Facturas abiertas (pagina)</p><strong>{invoiceSummary?.openCount ?? 0}</strong></article>
        <article className="director-kpi director-kpi--flat"><p className="text-muted">Past due (pagina)</p><strong>{invoiceSummary?.pastDueCount ?? 0}</strong></article>
        <article className="director-kpi director-kpi--flat"><p className="text-muted">AR total</p><strong>{formatMxn(report?.ar.summary.openTotalMxn ?? 0)}</strong></article>
        <article className="director-kpi director-kpi--flat"><p className="text-muted">Fees</p><strong>{formatMxn(report?.fees.totalFeesMxn ?? 0)}</strong></article>
      </section>

      {(report?.ar.summary.pastDueCount ?? 0) > 0 ? (
        <section className="card">
          <p className="text-muted">Alerta: hay {(report?.ar.summary.pastDueCount ?? 0)} facturas vencidas por {formatMxn(report?.ar.summary.pastDueTotalMxn ?? 0)}.</p>
        </section>
      ) : null}
      {(report?.fees.abnormal.length ?? 0) > 0 ? (
        <section className="card">
          <p className="text-muted">Alerta: {(report?.fees.abnormal.length ?? 0)} pagos con fee rate anormal (&gt;= 8%).</p>
        </section>
      ) : null}

      <section className="card">
        <h4 className="director-section-title">Crear factura</h4>
        <div className="form-grid">
          <label>Club
            <select value={newInvoiceClubId} onChange={(e) => setNewInvoiceClubId(e.target.value)}>
              <option value="">Selecciona...</option>
              {clubs.map((club) => <option key={club.id} value={club.id}>{club.name}</option>)}
            </select>
          </label>
          <label>Suscripcion
            <select value={newInvoiceSubscriptionId} onChange={(e) => setNewInvoiceSubscriptionId(e.target.value)}>
              <option value="">Opcional</option>
              {subscriptions.filter((s) => !newInvoiceClubId || s.clubId === newInvoiceClubId).map((sub) => (
                <option key={sub.id} value={sub.id}>{sub.club.name} · {sub.plan.name} · {sub.status}</option>
              ))}
            </select>
          </label>
          <label>Tipo
            <select value={newInvoiceType} onChange={(e) => setNewInvoiceType(e.target.value as DirectorInvoiceType)}>
              <option value="subscription">subscription</option>
              <option value="topup">topup</option>
              <option value="manual_adjustment">manual_adjustment</option>
            </select>
          </label>
          <label>IVA rate<input value={newInvoiceTaxRate} onChange={(e) => setNewInvoiceTaxRate(e.target.value)} /></label>
          <label>Due date<input type="date" value={newInvoiceDueAt} onChange={(e) => setNewInvoiceDueAt(e.target.value)} /></label>
          <label style={{ gridColumn: '1 / -1' }}>Notas<input value={newInvoiceNotes} onChange={(e) => setNewInvoiceNotes(e.target.value)} /></label>
        </div>
        <div className="director-table-wrap" style={{ marginTop: 12 }}>
          <table className="director-table">
            <thead><tr><th>Concepto</th><th>Cantidad</th><th>Unitario (cents)</th><th /></tr></thead>
            <tbody>
              {lines.map((line, index) => (
                <tr key={`line-${index}`}>
                  <td><input value={line.description} onChange={(e) => setLines((prev) => prev.map((row, i) => i === index ? { ...row, description: e.target.value } : row))} /></td>
                  <td><input type="number" value={line.qty} onChange={(e) => setLines((prev) => prev.map((row, i) => i === index ? { ...row, qty: e.target.value } : row))} /></td>
                  <td><input type="number" value={line.unitPriceMxn} onChange={(e) => setLines((prev) => prev.map((row, i) => i === index ? { ...row, unitPriceMxn: e.target.value } : row))} /></td>
                  <td><Button type="button" size="sm" variant="ghost" onClick={() => setLines((prev) => prev.length <= 1 ? prev : prev.filter((_, i) => i !== index))}>Quitar</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="director-managers-actions" style={{ marginTop: 12 }}>
          <Button type="button" variant="secondary" onClick={() => setLines((prev) => [...prev, blankLine()])}>Agregar concepto</Button>
          <Button type="button" loading={createInvoiceMutation.isPending} onClick={() => createInvoiceMutation.mutate()}>Crear factura</Button>
        </div>
      </section>

      <section className="card">
        <h4 className="director-section-title">Facturas</h4>
        <div className="director-toolbar__desktop">
          <select value={status} onChange={(e) => { setStatus(e.target.value as 'all' | DirectorInvoiceStatus); setPage(1) }}>
            <option value="all">Todos</option><option value="draft">draft</option><option value="issued">issued</option><option value="paid">paid</option><option value="void">void</option>
          </select>
          <select value={clubIdFilter} onChange={(e) => { setClubIdFilter(e.target.value); setPage(1) }}>
            <option value="">Todos los clubs</option>
            {clubs.map((club) => <option key={club.id} value={club.id}>{club.name}</option>)}
          </select>
        </div>
        {invoices.length === 0 ? (
          <CardEmptyState title="Sin facturas" description="Crea una factura para comenzar." />
        ) : (
          <div className="director-table-wrap">
            <table className="director-table">
              <thead><tr><th>ID</th><th>Club</th><th>Tipo</th><th>Estado</th><th>Total</th><th>Due</th><th>Paid</th><th>Pagos</th><th>Acciones</th></tr></thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td><code>{invoice.id.slice(0, 8)}</code></td>
                    <td>{invoice.club?.name ?? invoice.clubId}</td>
                    <td>{invoice.type}</td>
                    <td><span className={`badge ${invoice.status === 'paid' ? 'badge--success' : invoice.status === 'issued' ? 'badge--warning' : 'badge--info'}`}>{invoice.status}</span></td>
                    <td>{formatMxn(invoice.totalMxn)}</td>
                    <td>{formatDate(invoice.dueAt)}</td>
                    <td>{formatDate(invoice.paidAt)}</td>
                    <td>{invoice.payments?.length ?? 0}</td>
                    <td><Button type="button" size="sm" variant="secondary" onClick={() => { setSelectedInvoiceId(invoice.id); setPaymentAmountMxn(String(invoice.totalMxn)) }}>Ver / cobrar</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="director-managers-actions" style={{ marginTop: 12 }}>
          <Button type="button" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Anterior</Button>
          <Button type="button" variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Siguiente</Button>
        </div>
      </section>

      {selectedInvoice ? (
        <section className="card">
          <h4 className="director-section-title">Detalle / Cobro · {selectedInvoice.club?.name}</h4>
          <p className="text-muted">Factura <code>{selectedInvoice.id}</code> · Total {formatMxn(selectedInvoice.totalMxn)} · Estado {selectedInvoice.status}</p>
          <div className="form-grid">
            <label>Metodo
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as DirectorPaymentMethod)}>
                <option value="transfer">transfer</option><option value="cash">cash</option><option value="card">card</option><option value="provider">provider</option>
              </select>
            </label>
            <label>Monto (cents)<input type="number" value={paymentAmountMxn} onChange={(e) => setPaymentAmountMxn(e.target.value)} /></label>
            <label>Fee (cents)<input type="number" value={paymentFeeMxn} onChange={(e) => setPaymentFeeMxn(e.target.value)} /></label>
            <label>Provider ref<input value={paymentProviderRef} onChange={(e) => setPaymentProviderRef(e.target.value)} placeholder="Opcional / idempotencia" /></label>
          </div>
          <div className="director-managers-actions" style={{ marginTop: 12 }}>
            <Button type="button" loading={paymentMutation.isPending} onClick={() => paymentMutation.mutate()}>Registrar pago</Button>
          </div>

          <h5 style={{ marginTop: 16 }}>Pagos registrados</h5>
          {(selectedInvoice.payments?.length ?? 0) === 0 ? (
            <p className="text-muted">Sin pagos todavia.</p>
          ) : (
            <div className="director-table-wrap">
              <table className="director-table">
                <thead><tr><th>Pago</th><th>Metodo</th><th>Status</th><th>Monto</th><th>Fee</th><th>Neto</th><th>Fecha</th><th>Acciones</th></tr></thead>
                <tbody>
                  {(selectedInvoice.payments ?? []).map((payment) => (
                    <tr key={payment.id}>
                      <td><code>{payment.id.slice(0, 8)}</code></td>
                      <td>{payment.method}</td>
                      <td>{payment.status}</td>
                      <td>{formatMxn(payment.amountMxn)}</td>
                      <td>{formatMxn(payment.feeMxn)}</td>
                      <td>{formatMxn(payment.netMxn)}</td>
                      <td>{formatDate(payment.createdAt)}</td>
                      <td>
                        <Button type="button" size="sm" variant="ghost" disabled={payment.status === 'refunded'} loading={refundMutation.isPending} onClick={() => refundMutation.mutate(payment.id)}>
                          {payment.status === 'refunded' ? 'Refunded' : 'Refund'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}
    </div>
  )
}
