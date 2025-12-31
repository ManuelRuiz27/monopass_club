import { useRpAssignments } from '../hooks'
import { PagePlaceholder } from '@/components/PagePlaceholder'

export function AssignedEventsPage() {
  const { data, isLoading, error, refetch } = useRpAssignments()

  if (isLoading) {
    return <p>Cargando asignaciones...</p>
  }

  if (error) {
    return (
      <PagePlaceholder
        title="No pudimos cargar los eventos"
        description="Intenta refrescar en unos segundos."
        hint={
          <button type="button" onClick={() => refetch()}>
            Reintentar
          </button>
        }
      />
    )
  }

  if (!data || data.events.length === 0) {
    return <PagePlaceholder title="Sin eventos activos" description="Tu gerente aun no asigna eventos para este periodo." />
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ margin: 0 }}>Eventos asignados</h3>
          <p style={{ margin: 0, color: '#475569' }}>Revisa limites y status por tipo (OTHER se muestra como {data.otherLabel}).</p>
        </div>
        <button type="button" onClick={() => refetch()}>
          Refrescar
        </button>
      </div>
      <div className="card-grid">
        {data.events.map((event) => (
          <article key={event.assignmentId} className="card">
            <h4 style={{ margin: '0 0 0.25rem' }}>{event.eventName}</h4>
            <p style={{ margin: 0, color: '#475569' }}>{new Date(event.startsAt).toLocaleString()} — {event.clubName}</p>
            <div className="stats-row">
              <div>
                <strong>{event.usedAccesses}</strong>
                <span>Generados</span>
              </div>
              <div>
                <strong>{event.remainingAccesses ?? '∞'}</strong>
                <span>Restantes</span>
              </div>
              <div>
                <strong>{event.limitAccesses ?? 'Sin limite'}</strong>
                <span>Limite</span>
              </div>
            </div>
            <div className="badge-group">
              <span className="badge">General: {event.guestTypeCounts.GENERAL}</span>
              <span className="badge">VIP: {event.guestTypeCounts.VIP}</span>
              <span className="badge">
                {data.otherLabel}: {event.guestTypeCounts.OTHER}
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
