import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { managerApi, type RpDTO } from '../api'
import { useToast } from '@/components/ToastProvider'

const defaultRpForm = { name: 'Nuevo RP', username: '', password: 'changeme123' }

export function RpsPage() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const rpsQuery = useQuery({ queryKey: ['rps'], queryFn: managerApi.getRps })
  const eventsQuery = useQuery({ queryKey: ['events'], queryFn: managerApi.getEvents })
  const [form, setForm] = useState(defaultRpForm)

  const createRp = useMutation({
    mutationFn: () => managerApi.createRp(form),
    onSuccess: () => {
      toast.showToast({ title: 'RP creado', variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['rps'] })
      setForm(defaultRpForm)
    },
  })

  const updateRp = useMutation({
    mutationFn: ({ rpId, payload }: { rpId: string; payload: { active?: boolean; name?: string } }) =>
      managerApi.updateRp(rpId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rps'] })
    },
  })

  const updateLimitMutation = useMutation({
    mutationFn: ({ eventId, rpId, limit }: { eventId: string; rpId: string; limit: number | null }) =>
      managerApi.updateAssignmentLimit(eventId, rpId, limit),
    onSuccess: () => {
      toast.showToast({ title: 'Limite actualizado', variant: 'info' })
      queryClient.invalidateQueries({ queryKey: ['rps'] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })

  const handleToggleStatus = (rp: RpDTO) => {
    const message = rp.active ? 'Desactivar este RP impedira que genere accesos. Continuar?' : 'Reactivar RP?'
    if (!window.confirm(message)) return
    updateRp.mutate({ rpId: rp.id, payload: { active: !rp.active } })
  }

  const handleLimitUpdate = (rp: RpDTO, assignment: RpDTO['assignments'][number]) => {
    const suggested = assignment.limitAccesses ?? ''
    const raw = window.prompt(`Limite para ${assignment.event.name}`, suggested ? String(suggested) : '')
    if (raw === null) return
    const nextValue = raw.trim() === '' ? null : Number(raw)
    if (nextValue !== null && Number.isNaN(nextValue)) {
      toast.showToast({ title: 'Valor invalido', description: 'Ingresa un numero valido.', variant: 'error' })
      return
    }
    updateLimitMutation.mutate({ eventId: assignment.event.id, rpId: rp.id, limit: nextValue })
  }

  const assignedEventNames = (rp: RpDTO) =>
    rp.assignments.map((assignment) => assignment.event.name).join(', ') || 'Sin asignaciones'

  return (
    <div>
      <h3>Relaciones Publicas</h3>
      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault()
          createRp.mutate()
        }}
      >
        <label>
          Nombre
          <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required />
        </label>
        <label>
          Username
          <input value={form.username} onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))} required />
        </label>
        <label>
          Password temporal
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            required
          />
        </label>
        <button type="submit" disabled={createRp.isPending}>
          {createRp.isPending ? 'Creando...' : 'Crear RP'}
        </button>
      </form>

      {rpsQuery.isLoading ? <p>Cargando RPs...</p> : null}
      {rpsQuery.error ? <p className="text-danger">Error al consultar RPs</p> : null}

      <div className="card-grid" style={{ marginTop: '1.5rem' }}>
        {rpsQuery.data?.map((rp) => (
          <article key={rp.id} className="card">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: 0 }}>{rp.user.name}</h4>
                <p style={{ margin: 0 }} className="text-muted">{rp.user.username}</p>
              </div>
              <span className={`badge ${rp.active ? 'badge--success' : 'badge--danger'}`}>
                {rp.active ? 'Activo' : 'Inactivo'}
              </span>
            </header>
            <p className="text-muted" style={{ fontSize: '0.9rem' }}>Eventos: {assignedEventNames(rp)}</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => handleToggleStatus(rp)}>
                {rp.active ? 'Desactivar' : 'Activar'}
              </button>
            </div>
            <section style={{ marginTop: '0.75rem' }}>
              <h5 style={{ margin: '0.25rem 0' }}>Asignaciones</h5>
              {rp.assignments.length === 0 ? <p className="text-muted">Aun no tiene eventos.</p> : null}
              {rp.assignments.map((assignment) => (
                <div key={assignment.id} className="panel">
                  <strong>{assignment.event.name}</strong>
                  <p style={{ margin: '0.25rem 0' }} className="text-muted">
                    {new Date(assignment.event.startsAt).toLocaleDateString()} • {assignment.event.active ? 'Activo' : 'Cerrado'}
                  </p>
                  <p style={{ margin: 0 }}>Generados: {assignment.usedAccesses}</p>
                  <p style={{ margin: 0 }}>Limite: {assignment.limitAccesses ?? 'Sin limite'}</p>
                  <button type="button" onClick={() => handleLimitUpdate(rp, assignment)}>
                    Ajustar limite
                  </button>
                </div>
              ))}
            </section>
          </article>
        ))}
      </div>

      {eventsQuery.data && eventsQuery.data.length === 0 ? <p>No hay eventos creados.</p> : null}
    </div>
  )
}
