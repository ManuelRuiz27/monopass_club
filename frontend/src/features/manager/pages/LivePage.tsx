import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { managerApi } from '../api'
import { PageErrorState, PageLoadingState } from '@/components/ui'

function formatDateTime(value: string) {
  return new Date(value).toLocaleString([], {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatLastUpdated(timestamp: number) {
  if (!timestamp) return '--'
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function LivePage() {
  const liveQuery = useQuery({
    queryKey: ['manager', 'live'],
    queryFn: () => managerApi.getLiveEvents(),
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
  })

  const activeEvent = useMemo(() => {
    const rows = liveQuery.data?.events ?? []
    if (rows.length === 0) return null

    const inProgress = rows
      .filter((event) => event.inProgress)
      .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())

    return inProgress[0] ?? null
  }, [liveQuery.data?.events])

  const upcomingEvent = useMemo(() => {
    const rows = liveQuery.data?.events ?? []
    if (rows.length === 0) return null

    const nowMs = liveQuery.data?.serverNow ? new Date(liveQuery.data.serverNow).getTime() : Date.now()
    const upcoming = rows
      .filter((event) => new Date(event.startsAt).getTime() > nowMs)
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())

    return upcoming[0] ?? null
  }, [liveQuery.data?.events, liveQuery.data?.serverNow])

  if (liveQuery.isLoading) {
    return <PageLoadingState message="Cargando dashboard live..." />
  }

  if (liveQuery.error) {
    return <PageErrorState description="No pudimos obtener el aforo live de los eventos." />
  }

  return (
    <div className="manager-live-page manager-live-page--landing">
      <header className="manager-live-page__header">
        <div>
          <h3 className="manager-live-page__title">Live</h3>
          <p className="text-muted manager-live-page__subtitle">
            Aforo en vivo del evento en curso: accesos enviados y escaneados.
          </p>
        </div>
        <p className="text-muted">Ultima actualizacion: {formatLastUpdated(liveQuery.dataUpdatedAt)}</p>
      </header>

      {!activeEvent ? (
        <section className="manager-live-empty manager-live-empty--animated" aria-live="polite">
          <div className="manager-live-empty__scene" aria-hidden="true">
            <span className="manager-live-empty__pulse manager-live-empty__pulse--one" />
            <span className="manager-live-empty__pulse manager-live-empty__pulse--two" />
            <div className="manager-live-empty__monkey-wrap">
              <img
                className="manager-live-empty__monkey-image"
                src="/assets/logos/mono-sleep.png"
                alt="Mono durmiendo"
              />
              <span className="manager-live-empty__zzz manager-live-empty__zzz--one">z</span>
              <span className="manager-live-empty__zzz manager-live-empty__zzz--two">z</span>
              <span className="manager-live-empty__zzz manager-live-empty__zzz--three">z</span>
            </div>
          </div>
          <h4>
            Esperando {upcomingEvent ? upcomingEvent.eventName : 'activacion'} para tu proximo evento
          </h4>
          <p className="text-muted">
            {upcomingEvent
              ? `Inicia ${formatDateTime(upcomingEvent.startsAt)} en ${upcomingEvent.club.name}.`
              : 'En cuanto haya un evento activo, aqui veras enviados y escaneados en tiempo real.'}
          </p>
        </section>
      ) : (
        <>
          <section className="card manager-live-event">
            <p className="manager-live-event__tag">Evento en curso</p>
            <h4 className="manager-live-event__title">{activeEvent.eventName}</h4>
            <p className="text-muted manager-live-event__meta">
              {activeEvent.club.name} - {formatDateTime(activeEvent.startsAt)} a {formatDateTime(activeEvent.endsAt)}
            </p>
            <div className="manager-live-event__ambient" aria-hidden="true" />
          </section>

          <section className="manager-live-kpis">
            <article className="card manager-live-kpi">
              <p>Accesos enviados</p>
              <strong>{activeEvent.sentAccesses}</strong>
            </article>
            <article className="card manager-live-kpi">
              <p>Accesos escaneados</p>
              <strong>{activeEvent.scannedAccesses}</strong>
            </article>
            <article className="card manager-live-kpi">
              <p>Pendientes por escanear</p>
              <strong>{activeEvent.pendingAccesses}</strong>
            </article>
            <article className="card manager-live-kpi">
              <p>Aforo escaneado</p>
              <strong>
                {activeEvent.scannedAccesses}/{activeEvent.club.capacity}
              </strong>
              <small>{activeEvent.occupancyPercent}% del aforo</small>
              <div className="manager-dashboard-active-events__progress" aria-hidden="true">
                <span style={{ width: `${activeEvent.occupancyPercent}%` }} />
              </div>
            </article>
          </section>
        </>
      )}
    </div>
  )
}
