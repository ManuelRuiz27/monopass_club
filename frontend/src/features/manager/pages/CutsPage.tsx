import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { managerApi } from '../api'

function toIsoOrUndefined(value: string) {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

export function CutsPage() {
  const [eventFilter, setEventFilter] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [detailSelection, setDetailSelection] = useState<{ eventId: string; rpId: string } | null>(null)

  const cutsQuery = useQuery({
    queryKey: ['cuts', eventFilter, from, to],
    queryFn: () =>
      managerApi.getCuts({
        eventId: eventFilter || undefined,
        from: toIsoOrUndefined(from),
        to: toIsoOrUndefined(to),
      }),
  })

  const detailQuery = useQuery({
    queryKey: ['cut-detail', detailSelection?.eventId, detailSelection?.rpId, from, to],
    queryFn: () =>
      managerApi.getCutDetail(detailSelection!.eventId, detailSelection!.rpId, {
        from: toIsoOrUndefined(from),
        to: toIsoOrUndefined(to),
      }),
    enabled: Boolean(detailSelection),
  })

  const availableEvents = cutsQuery.data?.events ?? []

  const resetFilters = () => {
    setEventFilter('')
    setFrom('')
    setTo('')
  }

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Cortes en tiempo real</h3>
      <div className="form-grid" style={{ marginBottom: '1.5rem', maxWidth: 480 }}>
        <label>
          Evento
          <select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)}>
            <option value="">Todos</option>
            {availableEvents.map((event) => (
              <option key={event.eventId} value={event.eventId}>
                {event.eventName} - {new Date(event.startsAt).toLocaleDateString()}
              </option>
            ))}
          </select>
        </label>
        <label>
          Desde
          <input
            type="datetime-local"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            max={to || undefined}
          />
        </label>
        <label>
          Hasta
          <input
            type="datetime-local"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            min={from || undefined}
          />
        </label>
        <button type="button" onClick={resetFilters}>
          Limpiar filtros
        </button>
      </div>

      {cutsQuery.isLoading ? <p>Cargando cortes...</p> : null}
      {cutsQuery.error ? (
        <p style={{ color: '#b91c1c' }}>
          {(cutsQuery.error as Error).message || 'No se pudieron cargar los cortes'}
        </p>
      ) : null}

      {availableEvents.length === 0 && cutsQuery.isSuccess ? (
        <p>No hay escaneos registrados en este rango.</p>
      ) : null}

      <div className="card-grid">
        {availableEvents.map((event) => (
          <article key={event.eventId} className="card">
            <header style={{ marginBottom: '0.5rem' }}>
              <strong>{event.eventName}</strong>
              <p style={{ margin: 0, color: '#475569' }}>
                {event.clubName} - {new Date(event.startsAt).toLocaleString()}
              </p>
            </header>
            <div className="stats-row">
              <div>
                <strong>{event.totalScanned}</strong>
                <span>Total escaneados</span>
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
                  <th />
                </tr>
              </thead>
              <tbody>
                {event.rps.map((rp) => (
                  <tr key={rp.rpId}>
                    <td>{rp.rpName}</td>
                    <td>{rp.totalScanned}</td>
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
              <p style={{ margin: 0, color: '#475569' }}>
                Evento seleccionado y escaneos en el rango actual.
              </p>
            </div>
            <button type="button" onClick={() => setDetailSelection(null)}>
              Cerrar
            </button>
          </header>
          {detailQuery.isLoading ? <p>Cargando detalle...</p> : null}
          {detailQuery.error ? (
            <p style={{ color: '#b91c1c' }}>No se pudo cargar el detalle seleccionado.</p>
          ) : null}
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
                  <tr key={scan.ticketId + scan.scannedAt}>
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
