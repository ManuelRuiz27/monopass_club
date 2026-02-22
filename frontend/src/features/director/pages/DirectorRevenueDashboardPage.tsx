import { useQuery } from '@tanstack/react-query'
import { PageErrorState, PageLoadingState } from '@/components/ui'
import { directorMonetizationApi } from '../monetizationApi'
import { formatMxn } from '../monetizationUi'

export function DirectorRevenueDashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: ['director', 'monetization', 'dashboard'],
    queryFn: directorMonetizationApi.getRevenueDashboard,
  })
  const reportQuery = useQuery({
    queryKey: ['director', 'monetization', 'dashboard-report'],
    queryFn: () => directorMonetizationApi.getMonetizationReport({ granularity: 'month' }),
  })

  if (dashboardQuery.isLoading || reportQuery.isLoading) return <PageLoadingState message="Cargando dashboard de ingresos..." />
  if (dashboardQuery.error || reportQuery.error || !dashboardQuery.data || !reportQuery.data) {
    return <PageErrorState description="No se pudo cargar el dashboard de ingresos." />
  }

  const data = dashboardQuery.data
  const report = reportQuery.data

  return (
    <div className="director-page">
      <header className="director-page__header">
        <div>
          <h3 className="director-page__title">Monetizacion · Revenue Dashboard</h3>
          <p className="text-muted director-page__subtitle">KPIs de ingresos, cartera, churn proxy, fees y mix de planes.</p>
        </div>
      </header>

      <section className="director-kpis">
        <article className="director-kpi director-kpi--flat"><p className="text-muted">MRR</p><strong>{formatMxn(data.kpis.mrrMxn)}</strong></article>
        <article className="director-kpi director-kpi--flat"><p className="text-muted">ARR</p><strong>{formatMxn(data.kpis.arrMxn)}</strong></article>
        <article className="director-kpi director-kpi--flat"><p className="text-muted">Revenue 30d</p><strong>{formatMxn(data.kpis.revenueLast30DaysMxn)}</strong></article>
        <article className="director-kpi director-kpi--flat"><p className="text-muted">Revenue 90d</p><strong>{formatMxn(data.kpis.revenueLast90DaysMxn)}</strong></article>
        <article className="director-kpi director-kpi--flat"><p className="text-muted">AR total</p><strong>{formatMxn(data.kpis.arTotalsMxn)}</strong></article>
        <article className="director-kpi director-kpi--flat"><p className="text-muted">Churn proxy</p><strong>{(data.kpis.churnProxy * 100).toFixed(2)}%</strong></article>
      </section>

      {data.alerts.length > 0 ? (
        <section className="card">
          <h4 className="director-section-title">Alertas</h4>
          <div className="director-alerts">
            {data.alerts.map((alert) => (
              <article key={alert.id} className={`panel director-alert director-alert--${alert.level}`}>
                <strong>{alert.title}</strong>
                <p className="text-muted">{alert.description}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="director-grid">
        <article className="card">
          <h4 className="director-section-title">Mix de planes</h4>
          <div className="director-table-wrap">
            <table className="director-table">
              <thead><tr><th>Plan</th><th>Clubs</th><th>Revenue pagado</th></tr></thead>
              <tbody>
                {data.planMix.map((row) => (
                  <tr key={row.planId}>
                    <td>{row.planName}</td>
                    <td>{row.clubs}</td>
                    <td>{formatMxn(row.revenuePaidMxn)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="card">
          <h4 className="director-section-title">Cartera (AR)</h4>
          <p className="text-muted">Open invoices: {report.ar.summary.openCount}</p>
          <p className="text-muted">Open total: {formatMxn(report.ar.summary.openTotalMxn)}</p>
          <p className="text-muted">Past due: {report.ar.summary.pastDueCount}</p>
          <p className="text-muted">Past due total: {formatMxn(report.ar.summary.pastDueTotalMxn)}</p>

          <h4 className="director-section-title" style={{ marginTop: 16 }}>Fees</h4>
          <p className="text-muted">Total fees: {formatMxn(report.fees.totalFeesMxn)}</p>
          <p className="text-muted">Gross pagos: {formatMxn(report.fees.totalGrossMxn)}</p>
          <p className="text-muted">Refunds: {formatMxn(report.fees.totalRefundsMxn)}</p>
          <p className="text-muted">Abnormal fees: {report.fees.abnormal.length}</p>
        </article>
      </section>

      <section className="card">
        <h4 className="director-section-title">Ingresos por periodo</h4>
        <div className="director-table-wrap">
          <table className="director-table">
            <thead><tr><th>Periodo</th><th>Facturas</th><th>Total</th></tr></thead>
            <tbody>
              {report.revenueByPeriod.map((row) => (
                <tr key={row.period}>
                  <td>{row.period}</td>
                  <td>{row.invoices}</td>
                  <td>{formatMxn(row.totalMxn)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
