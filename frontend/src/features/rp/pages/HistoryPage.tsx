import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { rpApi, type GuestType } from '../api'
import { PagePlaceholder } from '@/components/PagePlaceholder'

export function HistoryPage() {
  const [filter, setFilter] = useState<GuestType | ''>('')
  const historyQuery = useQuery({
    queryKey: ['rp-history', filter],
    queryFn: () => rpApi.getTicketHistory(filter || undefined),
  })

  if (historyQuery.isLoading) {
    return <p>Cargando historial...</p>
  }

  if (historyQuery.error) {
    return <PagePlaceholder title="Sin historial" description="No pudimos cargar los tickets." />
  }

  const data = historyQuery.data

  if (!data || data.tickets.length === 0) {
    return <PagePlaceholder title="Sin historial disponible" description="Genera un acceso para comenzar." />
  }

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Historial</h3>
      <div className="form-grid" style={{ maxWidth: 320 }}>
        <label>
          Filtro por tipo
          <select value={filter} onChange={(e) => setFilter(e.target.value as GuestType | '')}>
            <option value="">Todos</option>
            <option value="GENERAL">General</option>
            <option value="VIP">VIP</option>
            <option value="OTHER">{data.otherLabel}</option>
          </select>
        </label>
      </div>
      <table>
        <thead>
          <tr>
            <th>Evento</th>
            <th>Tipo</th>
            <th>Estado</th>
            <th>Creado</th>
            <th>Scaneo</th>
          </tr>
        </thead>
        <tbody>
          {data.tickets.map((ticket) => (
            <tr key={ticket.id}>
              <td>
                <strong>{ticket.event.name}</strong>
                <br />
                <small>{new Date(ticket.event.startsAt).toLocaleDateString()}</small>
              </td>
              <td>
                <span className="badge">{ticket.displayLabel}</span>
              </td>
              <td>
                <span className={`badge ${ticket.status === 'SCANNED' ? 'badge--success' : 'badge--danger'}`}>
                  {ticket.status === 'SCANNED' ? 'Escaneado' : 'Pendiente'}
                </span>
              </td>
              <td>{new Date(ticket.createdAt).toLocaleString()}</td>
              <td>{ticket.scannedAt ? new Date(ticket.scannedAt).toLocaleString() : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
