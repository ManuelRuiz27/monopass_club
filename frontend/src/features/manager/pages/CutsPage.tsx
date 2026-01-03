import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { managerApi } from '../api'

function toIso(value: string) {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

export function CutsPage() {
  const [eventFilter, setEventFilter] = useState('')
  const [rpFilter, setRpFilter] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [detailSelection, setDetailSelection] = useState<{ eventId: string; rpId: string } | null>(null)

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
  const events = useMemo(() => summary?.events ?? [], [summary])

  const resetFilters = () => {
    setEventFilter('')
    setRpFilter('')
    setFrom('')
    setTo('')
  }

  const availableEvents = useMemo(() => events.map((event) => ({ id: event.eventId, name: event.eventName })), [events])

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Cortes en vivo</h3>
      <div className="form-grid" style={{ marginBottom: '1.5rem', maxWidth: 600 }}>
        <label>
          Evento
          <select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)}>
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
          <select value={rpFilter} onChange={(e) => setRpFilter(e.target.value)}>
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
          <input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} max={to || undefined} />
        </label>
        <label>
          Hasta
          <input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} min={from || undefined} />
        </label>
        <button type="button" onClick={resetFilters}>
          Limpiar filtros
        </button>
      </div>

      {cutsQuery.isLoading ? <p>Cargando cortes...</p> : null}
      {cutsQuery.error ? <p className="text-danger">No se pudieron obtener los cortes.</p> : null}

      {summary ? (
        <div className="card-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="card">
            <strong style={{ fontSize: '1.5rem' }}>{summary.total}</strong>
            <p>Total escaneados</p>
          </div>
          <div className="card">
            <strong>{summary.totalGeneral}</strong>
            <p>General</p>
          </div>
          <div className="card">
            <strong>{summary.totalVip}</strong>
            <p>VIP</p>
          </div>
          <div className="card">
            <strong>{summary.totalOther}</strong>
            <p>Otros</p>
          </div>
        </div>
      ) : null}

      <div className="card-grid">
        {events.map((event) => (
          <article key={event.eventId} className="card">
            <header style={{ marginBottom: '0.5rem' }}>
              <strong>{event.eventName}</strong>
              <p style={{ margin: 0 }} className="text-muted">
                {event.clubName}
              </p>
            </header>
            <div className="stats-row">
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
                <span>Other</span>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>RP</th>
                  <th>Total</th>
                  <th>General</th>
                  <th>VIP</th>
                  <th>Other</th>
                  <th></th>
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
                      <button type="button" onClick={() => setDetailSelection({ eventId: event.eventId, rpId: rp.rpId })}>
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        ))}
      </div>

      {detailSelection ? (
        <section className="card" style={{ marginTop: '1.5rem' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: 0 }}>Detalle por RP</h4>
              <p style={{ margin: 0 }} className="text-muted">
                Escaneos en el rango seleccionado.
              </p>
            </div>
            <button type="button" className="button--ghost" onClick={() => setDetailSelection(null)}>
              Cerrar
            </button>
          </header>
          {detailQuery.isLoading ? <p>Cargando detalle...</p> : null}
          {detailQuery.error ? <p className="text-danger">No se pudo cargar el detalle.</p> : null}
          {detailQuery.data ? (
            <table>
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
                    <td>{scan.ticketId.slice(0, 6)}</td>
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
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
