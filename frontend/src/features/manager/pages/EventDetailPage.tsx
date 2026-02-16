import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { managerApi } from '../api'
import { useToast } from '@/components/ToastProvider'
import { PagePlaceholder } from '@/components/PagePlaceholder'
import { Button, PageErrorState, PageLoadingState } from '@/components/ui'

function formatDateRange(startsAt: string, endsAt: string) {
  const start = new Date(startsAt).toLocaleString()
  const end = new Date(endsAt).toLocaleString()
  return `${start} - ${end}`
}

export function EventDetailPage() {
  const { eventId = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [assignForm, setAssignForm] = useState<{ rpId: string; limit: string }>({ rpId: '', limit: '' })

  const eventsQuery = useQuery({
    queryKey: ['events'],
    queryFn: managerApi.getEvents,
  })

  const event = useMemo(
    () => eventsQuery.data?.find((currentEvent) => currentEvent.id === eventId) ?? null,
    [eventId, eventsQuery.data],
  )

  const rpsQuery = useQuery({
    queryKey: ['rps'],
    queryFn: managerApi.getRps,
    enabled: Boolean(event),
  })

  const scannersQuery = useQuery({
    queryKey: ['scanners'],
    queryFn: managerApi.getScanners,
    enabled: Boolean(event),
  })

  const cutsQuery = useQuery({
    queryKey: ['event-detail-cuts', event?.id],
    queryFn: () => managerApi.getCuts({ eventId: event!.id }),
    enabled: Boolean(event),
  })

  const updateEventStatus = useMutation({
    mutationFn: (active: boolean) => managerApi.updateEvent(eventId, { active }),
    onSuccess: (_, active) => {
      toast.showToast({
        title: active ? 'Evento reabierto' : 'Evento cerrado',
        variant: active ? 'success' : 'info',
      })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['event-detail-cuts', eventId] })
    },
  })

  const assignMutation = useMutation({
    mutationFn: ({ rpId, limit }: { rpId: string; limit: number | null }) =>
      managerApi.assignRpToEvent(eventId, { rpId, limitAccesses: limit }),
    onSuccess: () => {
      toast.showToast({ title: 'RP asignado', variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      setAssignForm({ rpId: '', limit: '' })
    },
  })

  const updateLimitMutation = useMutation({
    mutationFn: ({ rpId, limit }: { rpId: string; limit: number | null }) =>
      managerApi.updateAssignmentLimit(eventId, rpId, limit),
    onSuccess: () => {
      toast.showToast({ title: 'Limite actualizado', variant: 'info' })
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })

  const removeAssignmentMutation = useMutation({
    mutationFn: (rpId: string) => managerApi.removeAssignment(eventId, rpId),
    onSuccess: () => {
      toast.showToast({ title: 'Asignacion removida', variant: 'info' })
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })

  if (eventsQuery.isLoading) {
    return <PageLoadingState message="Cargando detalle del evento..." />
  }

  if (eventsQuery.error) {
    return <PageErrorState title="Error al cargar evento" description="No se pudo cargar el detalle del evento." />
  }

  if (!event) {
    return (
      <PagePlaceholder
        title="Evento no encontrado"
        description="Selecciona un evento valido para ver su detalle."
        hint={
          <Button type="button" variant="secondary" onClick={() => navigate('/manager/events')}>
            Volver a eventos
          </Button>
        }
      />
    )
  }

  const totalUsed = event.assignments.reduce((accumulator, assignment) => accumulator + assignment.usedAccesses, 0)
  const limitedAssignments = event.assignments.filter((assignment) => assignment.limitAccesses !== null)
  const totalLimit = limitedAssignments.reduce(
    (accumulator, assignment) => accumulator + (assignment.limitAccesses ?? 0),
    0,
  )
  const soldSummary = limitedAssignments.length > 0 ? `${totalUsed} / ${totalLimit}` : `${totalUsed} / Sin limite`
  const attendanceSummary = String(cutsQuery.data?.events?.[0]?.total ?? cutsQuery.data?.total ?? 0)
  const incomeSummary = 'No disponible'

  const activeAssignments = [...event.assignments].sort((a, b) => b.usedAccesses - a.usedAccesses)
  const availableRps = (rpsQuery.data ?? []).filter(
    (rp) => rp.active && !event.assignments.some((assignment) => assignment.rpId === rp.id),
  )
  const scannerStaff = (scannersQuery.data ?? []).filter((scanner) => scanner.active).slice(0, 4)

  const handleAssignRp = () => {
    if (!event.active) return
    if (!assignForm.rpId) return
    const nextLimit = assignForm.limit.trim() === '' ? null : Number(assignForm.limit)
    if (nextLimit !== null && Number.isNaN(nextLimit)) {
      toast.showToast({ title: 'Valor invalido', description: 'Ingresa un numero valido.', variant: 'error' })
      return
    }
    assignMutation.mutate({ rpId: assignForm.rpId, limit: nextLimit })
  }

  const handleUpdateLimit = (rpId: string, currentLimit: number | null) => {
    const rawValue = window.prompt('Nuevo limite (deja vacio para sin limite)', currentLimit ? String(currentLimit) : '')
    if (rawValue === null) return
    const nextValue = rawValue.trim() === '' ? null : Number(rawValue)
    if (nextValue !== null && Number.isNaN(nextValue)) {
      toast.showToast({ title: 'Valor invalido', description: 'Ingresa un numero valido.', variant: 'error' })
      return
    }
    updateLimitMutation.mutate({ rpId, limit: nextValue })
  }

  const handleRemoveAssignment = (rpId: string) => {
    if (!window.confirm('Eliminar esta asignacion?')) return
    removeAssignmentMutation.mutate(rpId)
  }

  return (
    <div className="manager-event-detail">
      <header className="manager-event-detail__header">
        <div className="manager-event-detail__header-left">
          <Button type="button" variant="ghost" size="sm" onClick={() => navigate('/manager/events')}>
            Volver
          </Button>
          <h3 className="manager-event-detail__title">{event.name}</h3>
        </div>

        <div className="manager-event-detail__header-actions">
          <span className={`badge ${event.active ? 'badge--success' : 'badge--warning'}`}>
            {event.active ? 'Activo' : 'Cerrado'}
          </span>
          <Button
            type="button"
            variant={event.active ? 'danger' : 'success'}
            onClick={() => updateEventStatus.mutate(!event.active)}
            loading={updateEventStatus.isPending}
          >
            {event.active ? 'Cerrar evento' : 'Reabrir evento'}
          </Button>
        </div>
      </header>

      <p className="text-muted manager-event-detail__meta">{event.club.name} | {formatDateRange(event.startsAt, event.endsAt)}</p>

      {!event.active ? (
        <section className="manager-event-detail__overlay card">
          <h4>Evento Finalizado</h4>
          <p className="text-muted">Este evento ha sido cerrado. Solo lectura disponible.</p>
          <Button type="button" variant="secondary" onClick={() => navigate('/manager')}>
            Volver al Dashboard
          </Button>
        </section>
      ) : null}

      <section className="manager-event-detail__kpis">
        <article className="card">
          <p className="text-muted">Accesos Vendidos</p>
          <h4>{soldSummary}</h4>
        </article>
        <article className="card">
          <p className="text-muted">Asistencia Real</p>
          <h4>{attendanceSummary}</h4>
        </article>
        <article className="card">
          <p className="text-muted">Ingresos Totales</p>
          <h4>{incomeSummary}</h4>
        </article>
      </section>

      <section className="manager-event-detail__lists">
        <article className="card">
          <h4>Staff Asignado (Scanner)</h4>
          {scannersQuery.isLoading ? <p className="text-muted">Cargando staff...</p> : null}
          {!scannersQuery.isLoading && scannerStaff.length === 0 ? (
            <p className="text-muted">No hay staff asignado a este evento.</p>
          ) : null}
          {scannerStaff.map((scanner) => (
            <p key={scanner.id} className="text-muted">
              {scanner.user.name}
            </p>
          ))}
        </article>

        <article className="card">
          <h4>RPs Activos</h4>
          {activeAssignments.length === 0 ? <p className="text-muted">No hay RPs asignados.</p> : null}

          {activeAssignments.map((assignment) => (
            <div key={assignment.id} className="panel manager-event-detail__assignment">
              <strong>{assignment.rp.user.name}</strong>
              <p className="text-muted">Generados: {assignment.usedAccesses}</p>
              <p className="text-muted">Limite: {assignment.limitAccesses ?? 'Sin limite'}</p>

              <div className="manager-event-detail__assignment-actions">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleUpdateLimit(assignment.rpId, assignment.limitAccesses)}
                  disabled={!event.active}
                >
                  Editar limite
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => handleRemoveAssignment(assignment.rpId)}
                  disabled={!event.active}
                >
                  Quitar RP
                </Button>
              </div>
            </div>
          ))}

          <div className="manager-event-detail__assign-form">
            <h5>Asignar RP</h5>
            <div className="form-grid">
              <select
                value={assignForm.rpId}
                onChange={(eventValue) => setAssignForm((current) => ({ ...current, rpId: eventValue.target.value }))}
                disabled={!event.active || assignMutation.isPending}
              >
                <option value="">Selecciona RP</option>
                {availableRps.map((rp) => (
                  <option key={rp.id} value={rp.id}>
                    {rp.user.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                placeholder="Limite opcional"
                value={assignForm.limit}
                onChange={(eventValue) => setAssignForm((current) => ({ ...current, limit: eventValue.target.value }))}
                disabled={!event.active || assignMutation.isPending}
              />
              <Button type="button" onClick={handleAssignRp} disabled={!event.active || assignMutation.isPending}>
                {assignMutation.isPending ? 'Asignando...' : 'Asignar'}
              </Button>
            </div>
          </div>
        </article>
      </section>
    </div>
  )
}
