import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { managerApi } from '../api'
import { BottomSheet, Button, CardEmptyState, PageErrorState, PageLoadingState } from '@/components/ui'

const EVENTS_PAGE_SIZE = 6
const DETAIL_PAGE_SIZE = 25

function toIso(value: string) {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString()
}

export function CutsPage() {
  const [eventFilter, setEventFilter] = useState('')
  const [rpFilter, setRpFilter] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [detailSelection, setDetailSelection] = useState<{ eventId: string; rpId: string } | null>(null)
  const [eventsPage, setEventsPage] = useState(0)
  const [detailPage, setDetailPage] = useState(0)

  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const [pendingEventFilter, setPendingEventFilter] = useState('')
  const [pendingRpFilter, setPendingRpFilter] = useState('')
  const [pendingFrom, setPendingFrom] = useState('')
  const [pendingTo, setPendingTo] = useState('')

  const rpsQuery = useQuery({ queryKey: ['rps'], queryFn: managerApi.getRps })

  const cutsQuery = useQuery({
    queryKey: ['cuts', eventFilter, rpFilter, from, to],
    queryFn: () =>
      managerApi.getCuts({
        eventId: eventFilter || undefined,
        rpId: rpFilter || undefined,
        from: toIso(from) ?? null,
        to: toIso(to) ?? null,
      }),
  })

  const detailQuery = useQuery({
    queryKey: ['cut-detail', detailSelection?.eventId, detailSelection?.rpId, from, to],
    queryFn: () =>
      managerApi.getCutDetail(detailSelection!.eventId, detailSelection!.rpId, {
        from: toIso(from) ?? null,
        to: toIso(to) ?? null,
      }),
    enabled: Boolean(detailSelection),
  })

  const summary = cutsQuery.data
  const events = useMemo(() => {
    const source = summary?.events ?? []
    return [...source].sort((a, b) => b.total - a.total)
  }, [summary])
  const availableEvents = useMemo(() => events.map((event) => ({ id: event.eventId, name: event.eventName })), [events])
  const totalEventsPages = Math.max(1, Math.ceil(events.length / EVENTS_PAGE_SIZE))
  const eventsPageSafe = Math.min(eventsPage, totalEventsPages - 1)
  const pagedEvents = useMemo(() => {
    const start = eventsPageSafe * EVENTS_PAGE_SIZE
    return events.slice(start, start + EVENTS_PAGE_SIZE)
  }, [events, eventsPageSafe])

  const hasFilter = Boolean(eventFilter || rpFilter || from || to)
  const showFilteredEmpty = !cutsQuery.isLoading && !cutsQuery.error && events.length === 0

  const resetFilters = () => {
    setEventFilter('')
    setRpFilter('')
    setFrom('')
    setTo('')
    setEventsPage(0)
    setDetailPage(0)
  }

  const openFilterSheet = () => {
    setPendingEventFilter(eventFilter)
    setPendingRpFilter(rpFilter)
    setPendingFrom(from)
    setPendingTo(to)
    setIsFilterSheetOpen(true)
  }

  const applyPendingFilters = () => {
    setEventFilter(pendingEventFilter)
    setRpFilter(pendingRpFilter)
    setFrom(pendingFrom)
    setTo(pendingTo)
    setEventsPage(0)
    setDetailPage(0)
    setIsFilterSheetOpen(false)
  }

  const clearPendingFilters = () => {
    setPendingEventFilter('')
    setPendingRpFilter('')
    setPendingFrom('')
    setPendingTo('')
  }

  return (
    <div className="manager-cuts-page">
      <header className="manager-cuts-page__header">
        <div>
          <h3 className="manager-cuts-page__title">Cortes</h3>
          <p className="text-muted manager-cuts-page__subtitle">Monitorea cortes y escaneos por evento y RP</p>
        </div>
      </header>

      <section className="manager-cuts-toolbar">
        <div className="manager-cuts-toolbar__mobile">
          <Button type="button" variant="secondary" size="sm" onClick={openFilterSheet}>
            Filtrar
          </Button>
          {hasFilter ? (
            <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
              Limpiar
            </Button>
          ) : null}
        </div>

        <div className="manager-cuts-toolbar__desktop">
          <label>
            Evento
            <select
              value={eventFilter}
              onChange={(event) => {
                setEventFilter(event.target.value)
                setEventsPage(0)
                setDetailPage(0)
              }}
            >
              <option value="">Todos</option>
              {availableEvents.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            RP
            <select
              value={rpFilter}
              onChange={(event) => {
                setRpFilter(event.target.value)
                setEventsPage(0)
                setDetailPage(0)
              }}
            >
              <option value="">Todos</option>
              {rpsQuery.data?.map((rp) => (
                <option key={rp.id} value={rp.id}>
                  {rp.user.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Desde
            <input
              type="datetime-local"
              value={from}
              onChange={(event) => {
                setFrom(event.target.value)
                setEventsPage(0)
                setDetailPage(0)
              }}
              max={to || undefined}
            />
          </label>

          <label>
            Hasta
            <input
              type="datetime-local"
              value={to}
              onChange={(event) => {
                setTo(event.target.value)
                setEventsPage(0)
                setDetailPage(0)
              }}
              min={from || undefined}
            />
          </label>

          <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
            Limpiar filtros
          </Button>
        </div>
      </section>

      {cutsQuery.isLoading ? <PageLoadingState message="Cargando cortes..." /> : null}
      {cutsQuery.error ? <PageErrorState description="No se pudieron obtener los cortes." /> : null}

      {summary ? (
        <section className="manager-cuts-kpis">
          <article className="card manager-cuts-kpi-card">
            <p className="text-muted">Total escaneados</p>
            <strong>{summary.total}</strong>
          </article>
          <article className="card manager-cuts-kpi-card">
            <p className="text-muted">General</p>
            <strong>{summary.totalGeneral}</strong>
          </article>
          <article className="card manager-cuts-kpi-card">
            <p className="text-muted">VIP</p>
            <strong>{summary.totalVip}</strong>
          </article>
          <article className="card manager-cuts-kpi-card">
            <p className="text-muted">Otros</p>
            <strong>{summary.totalOther}</strong>
          </article>
        </section>
      ) : null}

      {showFilteredEmpty ? (
        <CardEmptyState
          title="No hay cortes para este filtro"
          description="Prueba con otro evento, RP o rango de fechas."
          actionLabel="Limpiar filtros"
          onAction={resetFilters}
        />
      ) : null}

      {!showFilteredEmpty ? (
        <section className="manager-cuts-events-list">
          {pagedEvents.map((event) => (
            <article key={event.eventId} className="card manager-cuts-event-card">
              <header className="manager-cuts-event-card__header">
                <div>
                  <h4 className="manager-cuts-event-card__title">{event.eventName}</h4>
                  <p className="text-muted manager-cuts-event-card__club">{event.clubName}</p>
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
              <p className="text-muted manager-cuts-detail__subtitle">Escaneos en el rango seleccionado.</p>
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

      <BottomSheet
        open={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        title="Filtrar cortes"
        actions={
          <>
            <Button type="button" variant="secondary" onClick={() => setIsFilterSheetOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={applyPendingFilters}>
              Aplicar
            </Button>
          </>
        }
      >
        <div className="form-grid manager-cuts-sheet">
          <label>
            Evento
            <select value={pendingEventFilter} onChange={(event) => setPendingEventFilter(event.target.value)}>
              <option value="">Todos</option>
              {availableEvents.map((event) => (
                <option key={`sheet-event-${event.id}`} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            RP
            <select value={pendingRpFilter} onChange={(event) => setPendingRpFilter(event.target.value)}>
              <option value="">Todos</option>
              {rpsQuery.data?.map((rp) => (
                <option key={`sheet-rp-${rp.id}`} value={rp.id}>
                  {rp.user.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Desde
            <input type="datetime-local" value={pendingFrom} onChange={(event) => setPendingFrom(event.target.value)} max={pendingTo || undefined} />
          </label>

          <label>
            Hasta
            <input type="datetime-local" value={pendingTo} onChange={(event) => setPendingTo(event.target.value)} min={pendingFrom || undefined} />
          </label>

          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              clearPendingFilters()
              setIsFilterSheetOpen(false)
              resetFilters()
            }}
          >
            Limpiar filtros
          </Button>
        </div>
      </BottomSheet>
    </div>
  )
}
