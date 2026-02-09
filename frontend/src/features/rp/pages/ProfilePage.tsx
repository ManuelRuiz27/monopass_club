import { useMemo } from 'react'
import { useAuth } from '@/features/auth/AuthContext'
import { useRpAssignments } from '../hooks'

export function ProfilePage() {
  const { session, logout } = useAuth()
  const { data, isLoading } = useRpAssignments()

  const assignedEvent = useMemo(() => {
    if (!data?.events?.length) return null
    const active = data.events.filter((event) => event.eventActive)
    if (!active.length) return null
    return [...active].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0]
  }, [data?.events])

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Perfil</h3>
      <p className="text-muted" style={{ marginTop: 0 }}>
        Datos basicos de tu cuenta RP.
      </p>

      <article className="card" style={{ maxWidth: 560 }}>
        <h4 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Usuario</h4>
        <p style={{ margin: 0 }}>
          <strong>ID:</strong> {session?.userId ?? 'Sin sesion'}
        </p>
        <p style={{ margin: '0.25rem 0 0' }}>
          <strong>Rol:</strong> RP
        </p>
      </article>

      <article className="card" style={{ maxWidth: 560, marginTop: '1rem' }}>
        <h4 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Evento asignado</h4>
        {isLoading ? <p className="text-muted">Cargando asignacion...</p> : null}
        {!isLoading && !assignedEvent ? <p className="text-muted">No hay evento activo asignado.</p> : null}
        {assignedEvent ? (
          <>
            <p style={{ margin: 0 }}>
              <strong>{assignedEvent.eventName}</strong>
            </p>
            <p className="text-muted" style={{ margin: '0.25rem 0 0' }}>
              {assignedEvent.clubName}
            </p>
            <p style={{ margin: '0.25rem 0 0' }}>
              {new Date(assignedEvent.startsAt).toLocaleString()}
            </p>
          </>
        ) : null}
      </article>

      <div style={{ marginTop: '1rem' }}>
        <button type="button" className="button--ghost" onClick={logout}>
          Cerrar sesion
        </button>
      </div>
    </div>
  )
}
