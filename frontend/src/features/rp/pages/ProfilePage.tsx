import { useMemo } from 'react'
import { useAuth } from '@/features/auth/AuthContext'
import { useRpAssignments } from '../hooks'
import { Button } from '@/components/ui'

export function ProfilePage() {
  const { session, logout } = useAuth()
  const { data, isLoading } = useRpAssignments()

  const assignedEvent = useMemo(() => {
    if (!data?.events?.length) return null
    const active = data.events.filter((event) => event.eventActive)
    if (!active.length) return null
    return [...active].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0]
  }, [data])

  return (
    <div className="rp-profile-page">
      <h3 className="rp-profile-page__title">Perfil</h3>
      <p className="text-muted rp-profile-page__subtitle">
        Datos basicos de tu cuenta RP.
      </p>

      <article className="card rp-profile-card">
        <h4 className="rp-profile-card__title">Usuario</h4>
        <p className="rp-profile-card__line">
          <strong>ID:</strong> {session?.userId ?? 'Sin sesion'}
        </p>
        <p className="rp-profile-card__line rp-profile-card__line--spaced">
          <strong>Rol:</strong> RP
        </p>
      </article>

      <article className="card rp-profile-card rp-profile-card--offset">
        <h4 className="rp-profile-card__title">Evento asignado</h4>
        {isLoading ? <p className="text-muted">Cargando asignacion...</p> : null}
        {!isLoading && !assignedEvent ? <p className="text-muted">No hay evento activo asignado.</p> : null}
        {assignedEvent ? (
          <>
            <p className="rp-profile-card__line">
              <strong>{assignedEvent.eventName}</strong>
            </p>
            <p className="text-muted rp-profile-card__line rp-profile-card__line--spaced">
              {assignedEvent.clubName}
            </p>
            <p className="rp-profile-card__line rp-profile-card__line--spaced">
              {new Date(assignedEvent.startsAt).toLocaleString()}
            </p>
          </>
        ) : null}
      </article>

      <div className="rp-profile-page__logout">
        <Button type="button" variant="ghost" onClick={logout}>
          Cerrar sesion
        </Button>
      </div>
    </div>
  )
}
