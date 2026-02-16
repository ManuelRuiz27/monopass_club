import { useDirectorData } from '../useDirectorData'
import { PageErrorState, PageLoadingState } from '@/components/ui'

export function DirectorDashboardPage() {
  const { data, isLoading, error } = useDirectorData()

  if (isLoading) {
    return <PageLoadingState message="Cargando dashboard global..." />
  }

  if (error || !data) {
    return <PageErrorState description="No se pudo cargar el dashboard global." />
  }

  const kpis = [
    { label: 'Clubs activos', value: `${data.overview.clubsActive}/${data.overview.clubsTotal}` },
    { label: 'Eventos activos', value: `${data.overview.eventsActive}/${data.overview.eventsTotal}` },
    { label: 'RPs activos', value: `${data.overview.rpsActive}/${data.overview.rpsTotal}` },
    { label: 'Scanners activos', value: `${data.overview.scannersActive}/${data.overview.scannersTotal}` },
    { label: 'Generados', value: data.overview.generatedTotal },
    { label: 'Escaneados', value: data.overview.scannedTotal },
    { label: 'Conversion global', value: `${data.overview.conversion}%` },
  ]

  return (
    <div className="director-page director-dashboard-page">
      <header className="director-page__header">
        <div>
          <h3 className="director-page__title">Dashboard global</h3>
          <p className="text-muted director-page__subtitle">Vista ejecutiva consolidada de operacion y asistencia.</p>
        </div>
      </header>

      <section className="director-kpis">
        {kpis.map((kpi) => (
          <article key={kpi.label} className="card director-kpi">
            <p className="text-muted">{kpi.label}</p>
            <strong>{kpi.value}</strong>
          </article>
        ))}
      </section>

      <section className="director-grid">
        <article className="card">
          <h4 className="director-section-title">Top clubs</h4>
          <div className="director-table-wrap director-dashboard-topclubs-table-wrap">
            <table className="director-table">
              <thead>
                <tr>
                  <th>Club</th>
                  <th>Generados</th>
                  <th>Escaneados</th>
                  <th>Conversion</th>
                </tr>
              </thead>
              <tbody>
                {data.topClubs.map((club) => (
                  <tr key={club.clubId}>
                    <td>{club.clubName}</td>
                    <td>{club.generated}</td>
                    <td>{club.scanned}</td>
                    <td>{club.conversion}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="director-dashboard-topclubs-mobile-list">
            {data.topClubs.map((club) => (
              <article key={`mobile-${club.clubId}`} className="card director-mobile-card">
                <header className="director-mobile-card__header">
                  <h4 className="director-mobile-card__title">{club.clubName}</h4>
                  <span className="badge">{club.conversion}%</span>
                </header>
                <div className="stats-row director-mobile-card__stats">
                  <div>
                    <strong>{club.generated}</strong>
                    <span>Generados</span>
                  </div>
                  <div>
                    <strong>{club.scanned}</strong>
                    <span>Escaneados</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="card">
          <h4 className="director-section-title">Alertas operativas</h4>
          {data.alerts.length === 0 ? (
            <p className="text-muted">Sin alertas criticas por ahora.</p>
          ) : (
            <div className="director-alerts">
              {data.alerts.slice(0, 6).map((alert) => (
                <article key={alert.id} className={`panel director-alert director-alert--${alert.level}`}>
                  <strong>{alert.title}</strong>
                  <p className="text-muted">{alert.description}</p>
                </article>
              ))}
            </div>
          )}
        </article>
      </section>
    </div>
  )
}
