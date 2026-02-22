import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { managerApi } from '../api'
import { Button, CardEmptyState, PageErrorState, PageLoadingState } from '@/components/ui'

const EVENTS_PAGE_SIZE = 6
const DETAIL_PAGE_SIZE = 25

function formatDateTime(value: string) {
  return new Date(value).toLocaleString()
}

function isEventInLastTwoWeeks(startsAt: string) {
  const eventDate = new Date(startsAt)
  if (Number.isNaN(eventDate.getTime())) return false

  const now = new Date()
  const twoWeeksAgo = new Date(now)
  twoWeeksAgo.setDate(now.getDate() - 14)

  return eventDate >= twoWeeksAgo && eventDate <= now
}

export function CutsPage() {
  const [detailSelection, setDetailSelection] = useState<{ eventId: string; rpId: string } | null>(null)
  const [eventsPage, setEventsPage] = useState(0)
  const [detailPage, setDetailPage] = useState(0)

  const cutsQuery = useQuery({
    queryKey: ['cuts', 'last-two-weeks'],
    queryFn: () => managerApi.getCuts(),
  })

  const detailQuery = useQuery({
    queryKey: ['cut-detail', detailSelection?.eventId, detailSelection?.rpId],
    queryFn: () => managerApi.getCutDetail(detailSelection!.eventId, detailSelection!.rpId),
    enabled: Boolean(detailSelection),
  })

  const events = useMemo(() => {
    const source = cutsQuery.data?.events ?? []
    return source
      .filter((event) => isEventInLastTwoWeeks(event.startsAt))
      .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())
  }, [cutsQuery.data?.events])

  const totalEventsPages = Math.max(1, Math.ceil(events.length / EVENTS_PAGE_SIZE))
  const eventsPageSafe = Math.min(eventsPage, totalEventsPages - 1)
  const pagedEvents = useMemo(() => {
    const start = eventsPageSafe * EVENTS_PAGE_SIZE
    return events.slice(start, start + EVENTS_PAGE_SIZE)
  }, [events, eventsPageSafe])

  const showEmpty = !cutsQuery.isLoading && !cutsQuery.error && events.length === 0

  return (
    <div className="manager-cuts-page">
      <header className="manager-cuts-page__header">
        <div>
          <h3 className="manager-cuts-page__title">Cortes</h3>
          <p className="text-muted manager-cuts-page__subtitle">
            Eventos de las ultimas 2 semanas ordenados del mas reciente al mas antiguo.
          </p>
        </div>
      </header>

      {cutsQuery.isLoading ? <PageLoadingState message="Cargando cortes..." /> : null}
      {cutsQuery.error ? <PageErrorState description="No se pudieron obtener los cortes." /> : null}

      {showEmpty ? (
        <CardEmptyState
          title="Sin eventos recientes"
          description="No hay eventos en las ultimas dos semanas para mostrar en cortes."
        />
      ) : null}

      {!showEmpty ? (
        <section className="manager-cuts-events-list">
          {pagedEvents.map((event) => (
            <article key={event.eventId} className="card manager-cuts-event-card">
              <header className="manager-cuts-event-card__header">
                <div>
                  <h4 className="manager-cuts-event-card__title">{event.eventName}</h4>
                  <p className="text-muted manager-cuts-event-card__club">{event.clubName}</p>
                  <p className="text-muted manager-cuts-event-card__club">
                    {formatDateTime(event.startsAt)} a {formatDateTime(event.endsAt)}
                  </p>
                </div>
              </header>

              <div className="stats-row manager-cuts-event-card__stats">
                <div>
                  <strong>{event.total}</strong>
                  <span>Total</span>
                </div>
                <div>
                  <strong>{event.totalGeneral}</strong>
                  <span>General</span>
                </div>
                <div>
                  <strong>{event.totalVip}</strong>
                  <span>VIP</span>
                </div>
                <div>
                  <strong>{event.totalOther}</strong>
                  <span>Otros</span>
                </div>
              </div>

              <div className="manager-cuts-event-table-wrap">
                <table className="manager-cuts-event-table">
                  <thead>
                    <tr>
                      <th>RP</th>
                      <th>Total</th>
                      <th>General</th>
                      <th>VIP</th>
                      <th>Otros</th>
                      <th>Accion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {event.rps.map((rp) => (
                      <tr key={rp.rpId}>
                        <td>{rp.rpName}</td>
                        <td>{rp.total}</td>
                        <td>{rp.totalGeneral}</td>
                        <td>{rp.totalVip}</td>
                        <td>{rp.totalOther}</td>
                        <td>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setDetailPage(0)
                              setDetailSelection({ eventId: event.eventId, rpId: rp.rpId })
                            }}
                          >
                            Ver detalle
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="manager-cuts-event-mobile-list">
                {event.rps.map((rp) => (
                  <article key={`mobile-${event.eventId}-${rp.rpId}`} className="manager-cuts-event-mobile-item panel">
                    <header className="manager-cuts-event-mobile-item__header">
                      <strong>{rp.rpName}</strong>
                      <span className="badge">{rp.total}</span>
                    </header>
                    <div className="manager-cuts-event-mobile-item__stats">
                      <span>General: {rp.totalGeneral}</span>
                      <span>VIP: {rp.totalVip}</span>
                      <span>Otros: {rp.totalOther}</span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setDetailPage(0)
                        setDetailSelection({ eventId: event.eventId, rpId: rp.rpId })
                      }}
                    >
                      Ver detalle
                    </Button>
                  </article>
                ))}
              </div>
            </article>
          ))}

          {events.length > EVENTS_PAGE_SIZE ? (
            <div className="manager-cuts-pagination">
              <p className="text-muted">
                Mostrando {eventsPageSafe * EVENTS_PAGE_SIZE + 1}-{Math.min((eventsPageSafe + 1) * EVENTS_PAGE_SIZE, events.length)} de{' '}
                {events.length} eventos
              </p>
              <div className="manager-cuts-pagination__actions">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={eventsPageSafe === 0}
                  onClick={() => setEventsPage((current) => Math.max(0, current - 1))}
                >
                  Anterior
                </Button>
                <span className="text-muted">
                  Pagina {eventsPageSafe + 1} / {totalEventsPages}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={eventsPageSafe >= totalEventsPages - 1}
                  onClick={() => setEventsPage((current) => Math.min(totalEventsPages - 1, current + 1))}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {detailSelection ? (
        <section className="card manager-cuts-detail">
          <header className="manager-cuts-detail__header">
            <div>
              <h4 className="manager-cuts-detail__title">Detalle por RP</h4>
              <p className="text-muted manager-cuts-detail__subtitle">Escaneos registrados para el evento seleccionado.</p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setDetailSelection(null)}>
              Cerrar
            </Button>
          </header>

          {detailQuery.isLoading ? <p className="text-muted">Cargando detalle...</p> : null}
          {detailQuery.error ? <p className="text-danger">No se pudo cargar el detalle.</p> : null}

          {detailQuery.data ? (
            <>
              {(() => {
                const totalDetailPages = Math.max(1, Math.ceil(detailQuery.data.scans.length / DETAIL_PAGE_SIZE))
                const safeDetailPage = Math.min(detailPage, totalDetailPages - 1)
                const start = safeDetailPage * DETAIL_PAGE_SIZE
                const pagedScans = detailQuery.data.scans.slice(start, start + DETAIL_PAGE_SIZE)
                return (
                  <>
                    <div className="manager-cuts-detail-table-wrap">
                      <table className="manager-cuts-detail-table">
                        <thead>
                          <tr>
                            <th>Ticket</th>
                            <th>Tipo</th>
                            <th>Nota</th>
                            <th>Scanner</th>
                            <th>Hora</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagedScans.map((scan) => (
                            <tr key={`${scan.ticketId}-${scan.scannedAt}`}>
                              <td>{scan.ticketId.slice(0, 6)}</td>
                              <td>
                                <span className="badge">{scan.displayLabel}</span>
                              </td>
                              <td>{scan.note ?? '-'}</td>
                              <td>{scan.scannerName}</td>
                              <td>{formatDateTime(scan.scannedAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="manager-cuts-detail-mobile-list">
                      {pagedScans.map((scan) => (
                        <article key={`mobile-${scan.ticketId}-${scan.scannedAt}`} className="panel manager-cuts-detail-mobile-item">
                          <header className="manager-cuts-detail-mobile-item__header">
                            <strong>{scan.ticketId.slice(0, 6)}</strong>
                            <span className="badge">{scan.displayLabel}</span>
                          </header>
                          <p className="text-muted">Scanner: {scan.scannerName}</p>
                          <p className="text-muted">Hora: {formatDateTime(scan.scannedAt)}</p>
                          <p className="text-muted">Nota: {scan.note ?? '-'}</p>
                        </article>
                      ))}
                    </div>

                    {detailQuery.data.scans.length > DETAIL_PAGE_SIZE ? (
                      <div className="manager-cuts-pagination manager-cuts-pagination--detail">
                        <p className="text-muted">
                          Mostrando {start + 1}-{Math.min(start + DETAIL_PAGE_SIZE, detailQuery.data.scans.length)} de {detailQuery.data.scans.length}{' '}
                          escaneos
                        </p>
                        <div className="manager-cuts-pagination__actions">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={safeDetailPage === 0}
                            onClick={() => setDetailPage((current) => Math.max(0, current - 1))}
                          >
                            Anterior
                          </Button>
                          <span className="text-muted">
                            Pagina {safeDetailPage + 1} / {totalDetailPages}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={safeDetailPage >= totalDetailPages - 1}
                            onClick={() => setDetailPage((current) => Math.min(totalDetailPages - 1, current + 1))}
                          >
                            Siguiente
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </>
                )
              })()}
            </>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
