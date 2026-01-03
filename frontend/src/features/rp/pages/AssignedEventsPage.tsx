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
    return <PagePlaceholder title="Sin eventos asignados" description="Tu gerente aun no vincula eventos para este periodo." />
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ margin: 0 }}>Eventos asignados</h3>
          <p style={{ margin: 0 }} className="text-muted">
            OTHER se muestra como {data.otherLabel}.
          </p>
        </div>
        <button type="button" className="button--ghost" onClick={() => refetch()}>
          Refrescar
        </button>
      </div>
      <div className="card-grid">
        {data.events.map((event) => (
          <article key={event.assignmentId} className="card">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: 0 }}>{event.eventName}</h4>
                <p style={{ margin: 0 }} className="text-muted">
                  {new Date(event.startsAt).toLocaleString()} - {event.clubName}
                </p>
              </div>
              <span className={`badge ${event.eventActive ? 'badge--success' : 'badge--danger'}`}>
                {event.eventActive ? 'Activo' : 'Cerrado'}
              </span>
            </header>
            <div className="stats-row">
              <div>
                <strong>{event.usedAccesses}</strong>
                <span>Generados</span>
              </div>
              <div>
                <strong>{event.remainingAccesses ?? 'Inf'}</strong>
                <span>Restantes</span>
              </div>
              <div>
                <strong>{event.limitAccesses ?? 'Sin limite'}</strong>
                <span>Limite</span>
              </div>
            </div>
            {!event.eventActive ? (
              <p className="text-warning" style={{ marginTop: 0 }}>
                Evento cerrado: solo lectura.
              </p>
            ) : null}
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
