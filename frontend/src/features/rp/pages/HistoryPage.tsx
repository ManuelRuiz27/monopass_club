import { useRpAssignments } from '../hooks'
import { PagePlaceholder } from '@/components/PagePlaceholder'

export function HistoryPage() {
  const { data, isLoading, error, refetch } = useRpAssignments()

  if (isLoading) {
    return <p>Cargando historial...</p>
  }

  if (error || !data || data.events.length === 0) {
    return (
      <PagePlaceholder
        title="Sin historial disponible"
        description="Genera un acceso para comenzar a ver estadisticas."
        hint={
          <button type="button" onClick={() => refetch()}>
            Reintentar
          </button>
        }
      />
    )
  }

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Historial rapido</h3>
      <p style={{ marginTop: 0, color: '#475569' }}>
        Referencia ligera basada en los tickets generados desde este dispositivo.
      </p>
      <div className="card-grid">
        {data.events.map((event) => (
          <article key={event.assignmentId} className="card">
            <h4 style={{ margin: '0 0 0.25rem' }}>{event.eventName}</h4>
            <p style={{ margin: 0, color: '#475569' }}>{new Date(event.startsAt).toLocaleString()}</p>
            <div style={{ marginTop: '0.5rem' }}>
              <div className="history-row">
                <span>General</span>
                <strong>{event.guestTypeCounts.GENERAL}</strong>
              </div>
              <div className="history-row">
                <span>VIP</span>
                <strong>{event.guestTypeCounts.VIP}</strong>
              </div>
              <div className="history-row">
                <span>{data.otherLabel}</span>
                <strong>{event.guestTypeCounts.OTHER}</strong>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
