import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { rpApi, type GuestType, type TicketDeliveryMethod } from '../api'
import { useRpAssignments } from '../hooks'
import { BottomSheet, Button, CardEmptyState, PageErrorState, PageLoadingState } from '@/components/ui'

function deliveryLabel(method: TicketDeliveryMethod | null) {
  if (method === 'WHATSAPP') return 'WhatsApp'
  if (method === 'DOWNLOAD') return 'Descargado'
  return 'Sin enviar'
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export function HistoryPage() {
  const [filter, setFilter] = useState<GuestType | ''>('')
  const [pendingFilter, setPendingFilter] = useState<GuestType | ''>('')
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)

  const historyQuery = useQuery({
    queryKey: ['rp-history', filter],
    queryFn: () => rpApi.getTicketHistory(filter || undefined),
  })
  const assignmentsQuery = useRpAssignments()

  const data = historyQuery.data
  const summary = useMemo(() => {
    const tickets = data?.tickets ?? []
    const whatsapp = tickets.filter((ticket) => ticket.deliveryMethod === 'WHATSAPP').length
    const downloaded = tickets.filter((ticket) => ticket.deliveryMethod === 'DOWNLOAD').length

    const assignedEvents = assignmentsQuery.data?.events ?? []
    const activeAssignedEvents = assignedEvents.filter((event) => event.eventActive)
    const hasUnlimited = activeAssignedEvents.some((event) => event.remainingAccesses === null)
    const available = hasUnlimited
      ? 'Ilimitado'
      : String(activeAssignedEvents.reduce((total, event) => total + (event.remainingAccesses ?? 0), 0))

    return {
      totalDelivered: whatsapp + downloaded,
      available,
    }
  }, [data, assignmentsQuery.data])

  if (historyQuery.isLoading || assignmentsQuery.isLoading) {
    return <PageLoadingState message="Cargando historial..." />
  }

  if (historyQuery.error) {
    return <PageErrorState title="Error al cargar historial" description="No pudimos cargar los envios de accesos." />
  }

  if (!data || data.tickets.length === 0) {
    return <CardEmptyState title="Sin historial disponible" description="Genera y comparte un acceso para comenzar." />
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
      <h3 className="rp-history-page__title">Historial de entregas</h3>
      <p className="rp-history-page__subtitle">Seguimiento del canal de entrega del acceso (WhatsApp o descarga) y hora registrada.</p>

      <section className="rp-history-kpis" aria-label="Resumen de envios">
        <article>
          <span>Total entregados</span>
          <strong>{summary.totalDelivered}</strong>
        </article>
        <article>
          <span>Disponibles</span>
          <strong>{summary.available}</strong>
        </article>
      </section>

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
            <select value={filter} onChange={(event) => setFilter(event.target.value as GuestType | '')}>
              <option value="">Todos</option>
              <option value="GENERAL">General</option>
              <option value="VIP">VIP</option>
              <option value="OTHER">{data.otherLabel}</option>
            </select>
          </label>
        </div>
      </div>

      <div className="rp-history-list">
        {data.tickets.map((ticket) => (
          <article key={ticket.id} className="card rp-history-item">
            <header className="rp-history-item__header">
              <div>
                <h4>{ticket.event.name}</h4>
                <p>{new Date(ticket.event.startsAt).toLocaleDateString()}</p>
              </div>
              <span className={`badge ${ticket.deliveryMethod ? 'badge--success' : 'badge--danger'}`}>
                {deliveryLabel(ticket.deliveryMethod)}
              </span>
            </header>

            <div className="rp-history-item__meta">
              <span className="badge">{ticket.displayLabel}</span>
              <small>Creado: {formatTime(ticket.createdAt)}</small>
            </div>
          </article>
        ))}
      </div>

      <div className="rp-history-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Evento</th>
              <th>Tipo</th>
              <th>Canal</th>
              <th>Creado</th>
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
                  <span className={`badge ${ticket.deliveryMethod ? 'badge--success' : 'badge--danger'}`}>
                    {deliveryLabel(ticket.deliveryMethod)}
                  </span>
                </td>
                <td>{formatTime(ticket.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
            <select value={pendingFilter} onChange={(event) => setPendingFilter(event.target.value as GuestType | '')}>
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
