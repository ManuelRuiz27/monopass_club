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
    {
      label: 'Clubs activos por suscripcion',
      value: `${data.overview.subscribedClubsActive}/${data.overview.clubsTotal}`,
    },
    {
      label: 'Eventos vendidos del mes',
      value: data.overview.monthlySoldEvents,
    },
  ]

  const statusLabel: Record<string, string> = {
    NEW: 'Nueva',
    CONTACTED: 'Contactada',
    BOOKED: 'Agendada',
    CANCELLED: 'Cancelada',
  }

  const formatDateTime = (value: string | null) => {
    if (!value) return 'Sin fecha'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return new Intl.DateTimeFormat('es-AR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date)
  }

  return (
    <div className="director-page director-dashboard-page">
      <header className="director-page__header">
        <div>
          <h3 className="director-page__title">Dashboard global</h3>
          <p className="text-muted director-page__subtitle">Vista ejecutiva enfocada en suscripciones y demanda captada desde la landing.</p>
        </div>
      </header>

      <section className="director-kpis">
        {kpis.map((kpi) => (
          <article key={kpi.label} className="director-kpi director-kpi--flat">
            <p className="text-muted">{kpi.label}</p>
            <strong>{kpi.value}</strong>
          </article>
        ))}
      </section>

      <section className="director-data-panel">
        <h4 className="director-section-title">Citas registradas desde landing</h4>
        {data.landingAppointments.length === 0 ? (
          <p className="text-muted">No hay citas registradas en la landing.</p>
        ) : (
          <>
            <div className="director-table-wrap director-dashboard-topclubs-table-wrap">
              <table className="director-table">
                <thead>
                  <tr>
                    <th>Fecha registro</th>
                    <th>Nombre</th>
                    <th>Telefono</th>
                    <th>Club interes</th>
                    <th>Tipo</th>
                    <th>Fecha preferida</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {data.landingAppointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td>{formatDateTime(appointment.createdAt)}</td>
                      <td>{appointment.fullName}</td>
                      <td>{appointment.phone}</td>
                      <td>{appointment.clubInterest}</td>
                      <td>{appointment.eventType}</td>
                      <td>{formatDateTime(appointment.preferredDate)}</td>
                      <td>{statusLabel[appointment.status] ?? appointment.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="director-dashboard-topclubs-mobile-list">
              {data.landingAppointments.map((appointment) => (
                <article key={`mobile-${appointment.id}`} className="director-mobile-card director-mobile-card--flat">
                  <header className="director-mobile-card__header">
                    <h4 className="director-mobile-card__title">{appointment.fullName}</h4>
                    <span className="badge">{statusLabel[appointment.status] ?? appointment.status}</span>
                  </header>
                  <div className="director-mobile-card__stats">
                    <p className="text-muted">{formatDateTime(appointment.createdAt)}</p>
                    <p>
                      <strong>Club:</strong> {appointment.clubInterest}
                    </p>
                    <p>
                      <strong>Tipo:</strong> {appointment.eventType}
                    </p>
                    <p>
                      <strong>Telefono:</strong> {appointment.phone}
                    </p>
                    <p>
                      <strong>Fecha preferida:</strong> {formatDateTime(appointment.preferredDate)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  )
}
