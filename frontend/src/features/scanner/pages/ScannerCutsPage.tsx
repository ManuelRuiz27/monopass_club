import { useLayoutEffect, useMemo, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { gsap } from 'gsap'
import { useSearchParams } from 'react-router-dom'
import { scannerApi } from '../api'
import { Button, CardEmptyState, PageErrorState, PageLoadingState } from '@/components/ui'
import { useGsapCountUp } from '@/lib/motion/useGsapCountUp'
import { usePrefersReducedMotion } from '@/lib/motion/usePrefersReducedMotion'

type SortBy = 'event' | 'rp' | 'general' | 'vip' | 'other' | 'total'
type SortDir = 'asc' | 'desc'

function toIso(value: string) {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

function parseNonNegativeInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? '', 10)
  if (Number.isNaN(parsed) || parsed < 0) return fallback
  return parsed
}

function compareNumber(a: number, b: number, dir: SortDir) {
  return dir === 'asc' ? a - b : b - a
}

function compareString(a: string, b: string, dir: SortDir) {
  const cmp = a.localeCompare(b, 'es', { sensitivity: 'base' })
  return dir === 'asc' ? cmp : -cmp
}

export function ScannerCutsPage() {
  const pageRef = useRef<HTMLDivElement | null>(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const [searchParams, setSearchParams] = useSearchParams()

  const eventFilter = searchParams.get('event') ?? ''
  const from = searchParams.get('from') ?? ''
  const to = searchParams.get('to') ?? ''
  const page = parseNonNegativeInt(searchParams.get('page'), 0)

  const sortByParam = searchParams.get('sortBy')
  const sortDirParam = searchParams.get('sortDir')
  const sortBy: SortBy =
    sortByParam === 'event' ||
    sortByParam === 'rp' ||
    sortByParam === 'general' ||
    sortByParam === 'vip' ||
    sortByParam === 'other' ||
    sortByParam === 'total'
      ? sortByParam
      : 'total'
  const sortDir: SortDir = sortDirParam === 'asc' ? 'asc' : 'desc'

  const detailEvent = searchParams.get('detailEvent')
  const detailRp = searchParams.get('detailRp')
  const detailPage = parseNonNegativeInt(searchParams.get('detailPage'), 0)
  const detailSelection = detailEvent && detailRp ? { eventId: detailEvent, rpId: detailRp } : null

  const pageSize = 20
  const offset = page * pageSize
  const detailPageSize = 50
  const detailOffset = detailPage * detailPageSize

  const updateParams = (updates: Record<string, string | null | undefined>) => {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === undefined || value === '') {
        next.delete(key)
      } else {
        next.set(key, value)
      }
    }
    setSearchParams(next)
  }

  const cutsQuery = useQuery({
    queryKey: ['scanner-cuts', eventFilter, from, to, page],
    queryFn: () =>
      scannerApi.getCuts({
        eventId: eventFilter || undefined,
        from: toIso(from) ?? null,
        to: toIso(to) ?? null,
        limit: pageSize,
        offset,
      }),
  })

  const summary = cutsQuery.data

  const detailQuery = useQuery({
    queryKey: ['scanner-cut-detail', detailSelection?.eventId, detailSelection?.rpId, from, to, detailPage],
    queryFn: () =>
      scannerApi.getCutDetail(detailSelection!.eventId, detailSelection!.rpId, {
        from: toIso(from) ?? null,
        to: toIso(to) ?? null,
        limit: detailPageSize,
        offset: detailOffset,
      }),
    enabled: Boolean(detailSelection),
  })

  const eventOptions = useMemo(
    () => (summary?.availableEvents ?? []).map((event) => ({ id: event.eventId, name: event.eventName })),
    [summary?.availableEvents],
  )

  const rpRows = useMemo(() => {
    if (!summary) return []

    const rows = summary.events.flatMap((event) =>
      event.rps.map((rp) => ({
        eventId: event.eventId,
        eventName: event.eventName,
        clubName: event.clubName,
        rpId: rp.rpId,
        rpName: rp.rpName,
        totalGeneral: rp.totalGeneral,
        totalVip: rp.totalVip,
        totalOther: rp.totalOther,
        total: rp.total,
      })),
    )

    return [...rows].sort((a, b) => {
      switch (sortBy) {
        case 'event':
          return compareString(a.eventName, b.eventName, sortDir)
        case 'rp':
          return compareString(a.rpName, b.rpName, sortDir)
        case 'general':
          return compareNumber(a.totalGeneral, b.totalGeneral, sortDir)
        case 'vip':
          return compareNumber(a.totalVip, b.totalVip, sortDir)
        case 'other':
          return compareNumber(a.totalOther, b.totalOther, sortDir)
        case 'total':
        default:
          return compareNumber(a.total, b.total, sortDir)
      }
    })
  }, [summary, sortBy, sortDir])

  const resetFilters = () => {
    setSearchParams(new URLSearchParams())
  }

  const cutsMotionKey = summary
    ? [summary.totalGeneral, summary.totalVip, summary.totalOther, summary.total, rpRows.length, detailSelection?.eventId ?? '-'].join('|')
    : 'empty'

  useGsapCountUp(pageRef, '.scanner-cuts-kpi__value[data-count-target]', cutsMotionKey)

  useLayoutEffect(() => {
    if (prefersReducedMotion) return

    const scope = pageRef.current
    if (!scope) return

    const context = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: 'power2.out' } })
      timeline
        .fromTo(
          '.scanner-cuts-page__title, .scanner-cuts-page__subtitle',
          { autoAlpha: 0, y: 10 },
          { autoAlpha: 1, y: 0, duration: 0.22, stagger: 0.06, clearProps: 'opacity,transform' },
        )
        .fromTo(
          '.scanner-cuts-filters',
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.24, clearProps: 'opacity,transform' },
          '-=0.08',
        )

      if (summary) {
        timeline.fromTo(
          '.scanner-cuts-kpi',
          { autoAlpha: 0, y: 18 },
          { autoAlpha: 1, y: 0, duration: 0.24, stagger: 0.05, clearProps: 'opacity,transform' },
          '-=0.1',
        )
      }

      if (rpRows.length > 0) {
        timeline.fromTo(
          '.scanner-cuts-table-wrap',
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.26, clearProps: 'opacity,transform' },
          '-=0.08',
        )
      }
    }, scope)

    return () => context.revert()
  }, [cutsMotionKey, prefersReducedMotion, rpRows.length, summary])

  return (
    <div ref={pageRef} className="scanner-cuts-page">
      <h3 className="scanner-cuts-page__title">Cortes en tiempo real</h3>
      <p className="text-muted scanner-cuts-page__subtitle">
        Resumen por evento y RP durante la operacion.
      </p>

      <div className="form-grid scanner-cuts-filters">
        <label>
          Evento
          <select
            value={eventFilter}
            onChange={(event) =>
              updateParams({
                event: event.target.value || null,
                page: '0',
                detailEvent: null,
                detailRp: null,
                detailPage: null,
              })
            }
          >
            <option value="">Todos</option>
            {eventOptions.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Desde
          <input
            type="datetime-local"
            value={from}
            onChange={(event) =>
              updateParams({ from: event.target.value || null, page: '0', detailEvent: null, detailRp: null, detailPage: null })
            }
            max={to || undefined}
          />
        </label>

        <label>
          Hasta
          <input
            type="datetime-local"
            value={to}
            onChange={(event) =>
              updateParams({ to: event.target.value || null, page: '0', detailEvent: null, detailRp: null, detailPage: null })
            }
            min={from || undefined}
          />
        </label>

        <label>
          Ordenar por
          <select value={sortBy} onChange={(event) => updateParams({ sortBy: event.target.value, page: '0' })}>
            <option value="total">Total</option>
            <option value="vip">VIP</option>
            <option value="general">General</option>
            <option value="other">Otro</option>
            <option value="rp">RP</option>
            <option value="event">Evento</option>
          </select>
        </label>

        <label>
          Direccion
          <select value={sortDir} onChange={(event) => updateParams({ sortDir: event.target.value })}>
            <option value="desc">Descendente</option>
            <option value="asc">Ascendente</option>
          </select>
        </label>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => updateParams({ page: String(Math.max(0, page - 1)), detailEvent: null, detailRp: null, detailPage: null })}
          disabled={page === 0}
        >
          Anterior
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => updateParams({ page: String(page + 1), detailEvent: null, detailRp: null, detailPage: null })}
          disabled={!summary?.pagination.hasMore}
        >
          Siguiente
        </Button>

        <Button type="button" size="sm" onClick={resetFilters}>
          Limpiar filtros
        </Button>
      </div>

      {summary ? (
        <p className="text-muted scanner-cuts-page__summary">
          Eventos mostrados: {summary.events.length} de {summary.pagination.totalEvents} - Pagina {page + 1}
        </p>
      ) : null}

      {cutsQuery.isLoading ? <PageLoadingState message="Cargando cortes..." /> : null}
      {cutsQuery.error ? <PageErrorState description="No se pudo cargar el resumen de cortes." /> : null}

      {summary ? (
        <div className="card-grid scanner-cuts-kpis">
          <article className="card scanner-cuts-kpi">
            <h4 className="scanner-cuts-kpi__title">Total general</h4>
            <strong className="scanner-cuts-kpi__value" data-count-target={summary.totalGeneral}>
              {summary.totalGeneral}
            </strong>
          </article>
          <article className="card scanner-cuts-kpi">
            <h4 className="scanner-cuts-kpi__title">Total VIP</h4>
            <strong className="scanner-cuts-kpi__value" data-count-target={summary.totalVip}>
              {summary.totalVip}
            </strong>
          </article>
          <article className="card scanner-cuts-kpi">
            <h4 className="scanner-cuts-kpi__title">Total otro</h4>
            <strong className="scanner-cuts-kpi__value" data-count-target={summary.totalOther}>
              {summary.totalOther}
            </strong>
          </article>
          <article className="card scanner-cuts-kpi">
            <h4 className="scanner-cuts-kpi__title">Total escaneados</h4>
            <strong className="scanner-cuts-kpi__value" data-count-target={summary.total}>
              {summary.total}
            </strong>
          </article>
        </div>
      ) : null}

      {summary && rpRows.length === 0 ? (
        <CardEmptyState
          title="Sin escaneos para los filtros actuales"
          description="Prueba con otro evento o rango de fechas."
          actionLabel="Limpiar filtros"
          onAction={resetFilters}
        />
      ) : null}

      {rpRows.length > 0 ? (
        <div className="scanner-cuts-table-wrap">
          <table className="scanner-cuts-table">
            <thead>
              <tr>
                <th>Evento</th>
                <th>RP</th>
                <th>General</th>
                <th>VIP</th>
                <th>Otro</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rpRows.map((row) => (
                <tr key={`${row.eventId}-${row.rpId}`}>
                  <td>
                    <strong>{row.eventName}</strong>
                    <br />
                    <small>{row.clubName}</small>
                  </td>
                  <td>{row.rpName}</td>
                  <td>{row.totalGeneral}</td>
                  <td>{row.totalVip}</td>
                  <td>{row.totalOther}</td>
                  <td>{row.total}</td>
                  <td>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => updateParams({ detailEvent: row.eventId, detailRp: row.rpId, detailPage: '0' })}
                    >
                      Ver detalle
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {detailSelection ? (
        <section className="card scanner-cuts-detail">
          <header className="scanner-cuts-detail__header">
            <div>
              <h4 className="scanner-cuts-detail__title">Detalle por RP</h4>
              <p className="text-muted scanner-cuts-detail__subtitle">
                Escaneos en el rango seleccionado.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => updateParams({ detailEvent: null, detailRp: null, detailPage: null })}
            >
              Cerrar
            </Button>
          </header>

          {detailQuery.isLoading ? <PageLoadingState message="Cargando detalle..." /> : null}
          {detailQuery.error ? <PageErrorState description="No se pudo cargar el detalle." /> : null}

          {detailQuery.data ? (
            <>
              <p className="text-muted scanner-cuts-detail__meta">
                {detailQuery.data.event.name} - {detailQuery.data.rp.name} - Total: {detailQuery.data.total}
              </p>
              <div className="scanner-cuts-detail__pager">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => updateParams({ detailPage: String(Math.max(0, detailPage - 1)) })}
                  disabled={detailPage === 0}
                >
                  Anterior detalle
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => updateParams({ detailPage: String(detailPage + 1) })}
                  disabled={!detailQuery.data.pagination.hasMore}
                >
                  Siguiente detalle
                </Button>
                <span className="text-muted scanner-cuts-detail__pager-label">
                  Pagina detalle {detailPage + 1}
                </span>
              </div>
              <div className="scanner-cuts-table-wrap">
                <table className="scanner-cuts-table">
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
                    {detailQuery.data.scans.map((scan) => (
                      <tr key={`${scan.ticketId}-${scan.scannedAt}`}>
                        <td>{scan.ticketId.slice(0, 8)}</td>
                        <td>
                          <span className="badge">{scan.displayLabel}</span>
                        </td>
                        <td>{scan.note ?? '-'}</td>
                        <td>{scan.scannerName}</td>
                        <td>{new Date(scan.scannedAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
