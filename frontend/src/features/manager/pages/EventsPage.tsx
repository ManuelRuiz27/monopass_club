import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { managerApi, type EventDTO } from '../api'
import { useToast } from '@/components/ToastProvider'

const defaultEventForm = () => ({
  clubId: '',
  name: 'Evento especial',
  startsAt: new Date().toISOString().slice(0, 16),
  endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
})

export function EventsPage() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const clubsQuery = useQuery({ queryKey: ['clubs'], queryFn: managerApi.getClubs })
  const eventsQuery = useQuery({ queryKey: ['events'], queryFn: managerApi.getEvents })
  const rpsQuery = useQuery({ queryKey: ['rps'], queryFn: managerApi.getRps })
  const [form, setForm] = useState(defaultEventForm())
  const [assignForms, setAssignForms] = useState<Record<string, { rpId: string; limit: string }>>({})

  const createEvent = useMutation({
    mutationFn: () =>
      managerApi.createEvent({
        clubId: form.clubId,
        name: form.name.trim(),
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
      }),
    onSuccess: () => {
      toast.showToast({ title: 'Evento creado', variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      setForm(defaultEventForm())
    },
  })

  const updateEventStatus = useMutation({
    mutationFn: (payload: { eventId: string; active: boolean }) => managerApi.updateEvent(payload.eventId, { active: payload.active }),
    onSuccess: (_, variables) => {
      toast.showToast({
        title: variables.active ? 'Evento reabierto' : 'Evento cerrado',
        variant: variables.active ? 'success' : 'info',
      })
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })

  const assignMutation = useMutation({
    mutationFn: ({ eventId, rpId, limit }: { eventId: string; rpId: string; limit: number | null }) =>
      managerApi.assignRpToEvent(eventId, { rpId, limitAccesses: limit }),
    onSuccess: (_, variables) => {
      toast.showToast({ title: 'RP asignado', variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      setAssignForms((prev) => ({ ...prev, [variables.eventId]: { rpId: '', limit: '' } }))
    },
  })

  const updateLimitMutation = useMutation({
    mutationFn: ({ eventId, rpId, limit }: { eventId: string; rpId: string; limit: number | null }) =>
      managerApi.updateAssignmentLimit(eventId, rpId, limit),
    onSuccess: () => {
      toast.showToast({ title: 'Limite actualizado', variant: 'info' })
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })

  const removeAssignmentMutation = useMutation({
    mutationFn: ({ eventId, rpId }: { eventId: string; rpId: string }) => managerApi.removeAssignment(eventId, rpId),
    onSuccess: () => {
      toast.showToast({ title: 'Asignacion removida', variant: 'info' })
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })

  const handleAssignSubmit = (eventId: string) => {
    const current = assignForms[eventId]
    if (!current?.rpId) return
    const limit = current.limit ? Number(current.limit) : null
    assignMutation.mutate({ eventId, rpId: current.rpId, limit })
  }

  const handleLimitUpdate = (event: EventDTO, rpId: string) => {
    const current = event.assignments.find((assignment) => assignment.rpId === rpId)
    const suggested = current?.limitAccesses ?? ''
    const raw = window.prompt('Nuevo limite (deja vacio para sin limite)', suggested ? String(suggested) : '')
    if (raw === null) return
    const nextValue = raw.trim() === '' ? null : Number(raw)
    if (nextValue !== null && Number.isNaN(nextValue)) {
      toast.showToast({ title: 'Valor invalido', description: 'Ingresa un numero valido.', variant: 'error' })
      return
    }
    updateLimitMutation.mutate({ eventId: event.id, rpId, limit: nextValue })
  }

  const handleRemoveAssignment = (eventId: string, rpId: string) => {
    if (!window.confirm('Eliminar esta asignacion?')) return
    removeAssignmentMutation.mutate({ eventId, rpId })
  }

  const availableRps = rpsQuery.data ?? []

  return (
    <div>
      <h3>Eventos</h3>
      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault()
          if (!form.clubId) return
          createEvent.mutate()
        }}
      >
        <label>
          Club
          <select value={form.clubId} onChange={(e) => setForm((prev) => ({ ...prev, clubId: e.target.value }))} required>
            <option value="" disabled>
              Selecciona un club
            </option>
            {clubsQuery.data?.map((club) => (
              <option key={club.id} value={club.id} disabled={!club.active}>
                {club.name} {!club.active ? '(Inactivo)' : ''}
              </option>
            ))}
          </select>
        </label>
        <label>
          Nombre
          <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required />
        </label>
        <label>
          Inicio
          <input
            type="datetime-local"
            value={form.startsAt}
            onChange={(e) => setForm((prev) => ({ ...prev, startsAt: e.target.value }))}
            required
          />
        </label>
        <label>
          Fin
          <input
            type="datetime-local"
            value={form.endsAt}
            onChange={(e) => setForm((prev) => ({ ...prev, endsAt: e.target.value }))}
            required
          />
        </label>
        <button type="submit" disabled={createEvent.isPending || !form.clubId}>
          {createEvent.isPending ? 'Creando...' : 'Crear evento'}
        </button>
      </form>

      {eventsQuery.isLoading ? <p>Cargando eventos...</p> : null}
      {eventsQuery.error ? <p className="text-danger">No se pudieron cargar los eventos.</p> : null}

      <div className="card-grid" style={{ marginTop: '1.5rem' }}>
        {eventsQuery.data?.map((event) => (
          <article key={event.id} className="card">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: 0 }}>{event.name}</h4>
                <p style={{ margin: 0 }} className="text-muted">
                  {event.club.name}
                </p>
                <small>{new Date(event.startsAt).toLocaleString()} - {new Date(event.endsAt).toLocaleString()}</small>
              </div>
              <span className={`badge ${event.active ? 'badge--success' : 'badge--danger'}`}>
                {event.active ? 'Activo' : 'Cerrado'}
              </span>
            </header>
            <div style={{ margin: '0.75rem 0', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => updateEventStatus.mutate({ eventId: event.id, active: !event.active })}>
                {event.active ? 'Cerrar evento' : 'Reabrir'}
              </button>
            </div>
            <section>
              <h5 style={{ margin: '0.5rem 0' }}>RPs asignados</h5>
              {event.assignments.length === 0 ? <p className="text-muted">Aun no hay asignaciones.</p> : null}
              {event.assignments.map((assignment) => (
                <div key={assignment.id} className="panel">
                  <strong>{assignment.rp.user.name}</strong>
                  <p style={{ margin: '0.25rem 0' }} className="text-muted">
                    Generados: {assignment.usedAccesses}
                  </p>
                  <p style={{ margin: '0.25rem 0' }} className="text-muted">
                    Limite: {assignment.limitAccesses ?? 'Sin limite'}
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => handleLimitUpdate(event, assignment.rpId)}>
                      Editar limite
                    </button>
                    <button type="button" onClick={() => handleRemoveAssignment(event.id, assignment.rpId)}>
                      Quitar RP
                    </button>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: '0.75rem' }}>
                <h6 style={{ margin: '0.25rem 0' }}>Asignar RP</h6>
                <div className="form-grid">
                  <select
                    value={assignForms[event.id]?.rpId ?? ''}
                    onChange={(e) =>
                      setAssignForms((prev) => ({ ...prev, [event.id]: { rpId: e.target.value, limit: prev[event.id]?.limit ?? '' } }))
                    }
                    disabled={!event.active}
                  >
                    <option value="">Selecciona RP</option>
                    {availableRps.map((rp) => (
                      <option key={rp.id} value={rp.id} disabled={!rp.active}>
                        {rp.user.name} {!rp.active ? '(Inactivo)' : ''}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    placeholder="Limite opcional"
                    value={assignForms[event.id]?.limit ?? ''}
                    onChange={(e) =>
                      setAssignForms((prev) => ({ ...prev, [event.id]: { rpId: prev[event.id]?.rpId ?? '', limit: e.target.value } }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => handleAssignSubmit(event.id)}
                    disabled={!event.active || assignMutation.isPending}
                  >
                    {assignMutation.isPending ? 'Asignando...' : 'Asignar'}
                  </button>
                </div>
              </div>
            </section>
          </article>
        ))}
      </div>
    </div>
  )
}
