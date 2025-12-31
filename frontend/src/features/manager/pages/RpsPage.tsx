import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { managerApi } from '../api'

export function RpsPage() {
  const queryClient = useQueryClient()
  const rpsQuery = useQuery({ queryKey: ['rps'], queryFn: managerApi.getRps })
  const eventsQuery = useQuery({ queryKey: ['events'], queryFn: managerApi.getEvents })

  const [rpForm, setRpForm] = useState({ name: 'Nuevo RP', username: '', password: 'changeme123' })
  const [assignmentForm, setAssignmentForm] = useState({ eventId: '', rpId: '', limitAccesses: '' })

  const createRp = useMutation({
    mutationFn: () => managerApi.createRp(rpForm),
    onSuccess: () => {
      setRpForm({ name: '', username: '', password: 'changeme123' })
      queryClient.invalidateQueries({ queryKey: ['rps'] })
    },
  })

  const assignRp = useMutation({
    mutationFn: () =>
      managerApi.assignRpToEvent(assignmentForm.eventId, {
        rpId: assignmentForm.rpId,
        limitAccesses: assignmentForm.limitAccesses ? Number(assignmentForm.limitAccesses) : null,
      }),
    onSuccess: () => {
      setAssignmentForm({ eventId: '', rpId: '', limitAccesses: '' })
      queryClient.invalidateQueries({ queryKey: ['events', { eventId: assignmentForm.eventId }] })
    },
  })

  return (
    <div>
      <h3>Relaciones Públicas</h3>
      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault()
          createRp.mutate()
        }}
      >
        <label>
          Nombre
          <input value={rpForm.name} onChange={(e) => setRpForm((prev) => ({ ...prev, name: e.target.value }))} required />
        </label>
        <label>
          Username
          <input value={rpForm.username} onChange={(e) => setRpForm((prev) => ({ ...prev, username: e.target.value }))} required />
        </label>
        <label>
          Password
          <input
            type="password"
            value={rpForm.password}
            onChange={(e) => setRpForm((prev) => ({ ...prev, password: e.target.value }))}
            required
          />
        </label>
        <button type="submit" disabled={createRp.isPending}>
          {createRp.isPending ? 'Creando…' : 'Crear RP'}
        </button>
      </form>

      {rpsQuery.data ? (
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Usuario</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {rpsQuery.data.map((rp) => (
              <tr key={rp.id}>
                <td>{rp.user.name}</td>
                <td>{rp.user.username}</td>
                <td>
                  <span className="badge">{rp.active ? 'Activo' : 'Inactivo'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      <h4>Asignar RP a evento</h4>
      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault()
          assignRp.mutate()
        }}
      >
        <label>
          Evento
          <select
            value={assignmentForm.eventId}
            onChange={(e) => setAssignmentForm((prev) => ({ ...prev, eventId: e.target.value }))}
            required
          >
            <option value="" disabled>
              Selecciona evento
            </option>
            {eventsQuery.data?.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          RP
          <select
            value={assignmentForm.rpId}
            onChange={(e) => setAssignmentForm((prev) => ({ ...prev, rpId: e.target.value }))}
            required
          >
            <option value="" disabled>
              Selecciona RP
            </option>
            {rpsQuery.data?.map((rp) => (
              <option key={rp.id} value={rp.id}>
                {rp.user.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Límite opcional
          <input
            type="number"
            min={0}
            value={assignmentForm.limitAccesses}
            onChange={(e) => setAssignmentForm((prev) => ({ ...prev, limitAccesses: e.target.value }))}
          />
        </label>
        <button type="submit" disabled={assignRp.isPending || !assignmentForm.eventId || !assignmentForm.rpId}>
          {assignRp.isPending ? 'Asignando…' : 'Asignar'}
        </button>
      </form>
    </div>
  )
}