import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { managerApi } from '../api'
import { PageErrorState, PageLoadingState } from '@/components/ui'

type ActiveEventRow = {
  id: string
  name: string
  clubName: string
  startsAt: string
  endsAt: string
  rpAssigned: number
  rpWithActivity: number
  sharedAccesses: number
  totalRpCapacity: number | null
  progressPercent: number | null
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString([], {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function useActiveEventsRows(): { data: ActiveEventRow[] | null; isLoading: boolean; error: unknown } {
  const eventsQuery = useQuery({ queryKey: ['events'], queryFn: managerApi.getEvents })

  return useMemo(() => {
    if (eventsQuery.isLoading) {
      return { data: null, isLoading: true, error: null }
    }

    if (eventsQuery.error) {
      return { data: null, isLoading: false, error: eventsQuery.error }
    }

    const rows =
      eventsQuery.data
        ?.filter((event) => event.active)
        .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
        .map((event) => {
          const rpAssigned = event.assignments.length
          const rpWithActivity = event.assignments.filter((assignment) => assignment.usedAccesses > 0).length
          const sharedAccesses = event.assignments.reduce((sum, assignment) => sum + assignment.usedAccesses, 0)
          const hasUnlimitedRp = event.assignments.some((assignment) => assignment.limitAccesses === null)
          const totalRpCapacity = hasUnlimitedRp
            ? null
            : event.assignments.reduce((sum, assignment) => sum + (assignment.limitAccesses ?? 0), 0)
          const progressPercent =
            totalRpCapacity && totalRpCapacity > 0 ? Math.min(100, Math.round((sharedAccesses / totalRpCapacity) * 100)) : null

          return {
            id: event.id,
            name: event.name,
            clubName: event.club.name,
            startsAt: event.startsAt,
            endsAt: event.endsAt,
            rpAssigned,
            rpWithActivity,
            sharedAccesses,
            totalRpCapacity,
            progressPercent,
          }
        }) ?? []

    return { data: rows, isLoading: false, error: null }
  }, [eventsQuery.data, eventsQuery.error, eventsQuery.isLoading])
}

export function DashboardPage() {
  const { data: rows, isLoading, error } = useActiveEventsRows()

  if (isLoading) {
    return <PageLoadingState message="Cargando eventos activos..." />
  }

  if (error || !rows) {
    return <PageErrorState description="No pudimos obtener los eventos activos." />
  }

  return (
    <div className="manager-dashboard-page">
      <header className="manager-dashboard-page__header">
        <div>
          <h3 className="manager-dashboard-page__title">Eventos activos</h3>
          <p className="text-muted manager-dashboard-page__subtitle">Accesos enviados/compartidos vs cupo total asignado por RPs.</p>
        </div>
      </header>

      <section className="card manager-dashboard-active-events">
        <h4 className="manager-dashboard-section-title">Tablero operativo</h4>

        {rows.length === 0 ? (
          <p className="text-muted manager-dashboard-active-events__empty">No hay eventos activos en este momento.</p>
        ) : (
          <div className="manager-dashboard-active-events__table-wrap">
            <table className="manager-dashboard-active-events__table">
              <thead>
                <tr>
                  <th>Evento</th>
                  <th>Rango</th>
                  <th>RPs con envio</th>
                  <th>Accesos enviados / cupo RP</th>
                  <th>Avance</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.name}</strong>
                      <p className="text-muted manager-dashboard-active-events__club">{row.clubName}</p>
                    </td>
                    <td>
                      <p className="manager-dashboard-active-events__date">{formatDateTime(row.startsAt)}</p>
                      <p className="text-muted manager-dashboard-active-events__date">a {formatDateTime(row.endsAt)}</p>
                    </td>
                    <td>
                      {row.rpWithActivity}/{row.rpAssigned || 0}
                    </td>
                    <td>
                      {row.sharedAccesses} / {row.totalRpCapacity === null ? 'Sin limite' : row.totalRpCapacity}
                    </td>
                    <td>
                      {row.progressPercent === null ? (
                        <span className="text-muted">Sin limite</span>
                      ) : (
                        <div className="manager-dashboard-active-events__progress-wrap">
                          <div
                            className="manager-dashboard-active-events__progress"
                            role="progressbar"
                            aria-label={`Progreso de ${row.name}`}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={row.progressPercent}
                          >
                            <span style={{ width: `${row.progressPercent}%` }} />
                          </div>
                          <small>{row.progressPercent}%</small>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card manager-dashboard-actions">
        <h4 className="manager-dashboard-section-title">Acciones rapidas</h4>
        <div className="manager-dashboard-actions__list">
          <Link to="events" className="button">
            + Crear evento
          </Link>
          <Link to="team/rps" className="button button--ghost">
            Gestionar RPs
          </Link>
          <Link to="cuts" className="button button--ghost">
            Ver cortes
          </Link>
        </div>
      </section>
    </div>
  )
}
