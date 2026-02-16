import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { rpApi, type GuestType } from '../api'
import { BottomSheet, Button, CardEmptyState, PageErrorState, PageLoadingState } from '@/components/ui'

export function HistoryPage() {
  const [filter, setFilter] = useState<GuestType | ''>('')
  const [pendingFilter, setPendingFilter] = useState<GuestType | ''>('')
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)

  const historyQuery = useQuery({
    queryKey: ['rp-history', filter],
    queryFn: () => rpApi.getTicketHistory(filter || undefined),
  })

  if (historyQuery.isLoading) {
    return <PageLoadingState message="Cargando historial..." />
  }

  if (historyQuery.error) {
    return <PageErrorState title="Error al cargar historial" description="No pudimos cargar los tickets." />
  }

  const data = historyQuery.data

  if (!data || data.tickets.length === 0) {
    return <CardEmptyState title="Sin historial disponible" description="Genera un acceso para comenzar." />
  }

  const openFilterSheet = () => {
    setPendingFilter(filter)
    setIsFilterSheetOpen(true)
  }

  const closeFilterSheet = () => {
    setIsFilterSheetOpen(false)
  }

  const applyPendingFilter = () => {
    setFilter(pendingFilter)
    setIsFilterSheetOpen(false)
  }

  return (
    <div className="rp-history-page">
      <h3 className="rp-history-page__title">Historial</h3>

      <div className="rp-history-toolbar">
        <div className="rp-history-toolbar__mobile">
          <Button type="button" variant="secondary" size="sm" onClick={openFilterSheet}>
            Filtrar
          </Button>
          {filter ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => setFilter('')}>
              Limpiar
            </Button>
          ) : null}
        </div>

        <div className="rp-history-toolbar__desktop">
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

      <BottomSheet
        open={isFilterSheetOpen}
        onClose={closeFilterSheet}
        title="Filtrar historial"
        actions={
          <>
            <Button type="button" variant="secondary" onClick={closeFilterSheet}>
              Cancelar
            </Button>
            <Button type="button" onClick={applyPendingFilter}>
              Aplicar
            </Button>
          </>
        }
      >
        <div className="form-grid rp-history-sheet">
          <label>
            Tipo de acceso
            <select value={pendingFilter} onChange={(e) => setPendingFilter(e.target.value as GuestType | '')}>
              <option value="">Todos</option>
              <option value="GENERAL">General</option>
              <option value="VIP">VIP</option>
              <option value="OTHER">{data.otherLabel}</option>
            </select>
          </label>
        </div>
      </BottomSheet>
    </div>
  )
}
