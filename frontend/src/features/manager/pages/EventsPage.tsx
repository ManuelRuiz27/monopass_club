import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { managerApi } from '../api'

export function EventsPage() {
  const queryClient = useQueryClient()
  const clubsQuery = useQuery({ queryKey: ['clubs'], queryFn: managerApi.getClubs })
  const eventsQuery = useQuery({ queryKey: ['events'], queryFn: managerApi.getEvents })

  const [form, setForm] = useState({
    clubId: '',
    name: 'Evento Especial',
    startsAt: new Date().toISOString().slice(0, 16),
    endsAt: new Date(Date.now() + 7200000).toISOString().slice(0, 16),
  })

  const createEvent = useMutation({
    mutationFn: () =>
      managerApi.createEvent({
        clubId: form.clubId,
        name: form.name,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })

  const clubs = clubsQuery.data ?? []

  const sortedEvents = useMemo(() => {
    if (!eventsQuery.data) return []
    return [...eventsQuery.data].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
  }, [eventsQuery.data])

  return (
    <div>
      <h3>Eventos</h3>
      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault()
          createEvent.mutate()
        }}
      >
        <label>
          Club
          <select
            value={form.clubId}
            onChange={(e) => setForm((prev) => ({ ...prev, clubId: e.target.value }))}
            required
          >
            <option value="" disabled>
              Selecciona un club
            </option>
            {clubs.map((club) => (
              <option key={club.id} value={club.id}>
                {club.name}
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
          {createEvent.isPending ? 'Creando…' : 'Crear evento'}
        </button>
      </form>

      {eventsQuery.isLoading ? <p>Cargando eventos…</p> : null}
      {eventsQuery.error ? <p style={{ color: '#dc2626' }}>No se pudieron cargar los eventos</p> : null}

      {sortedEvents.length ? (
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Club</th>
              <th>Inicio</th>
              <th>Fin</th>
            </tr>
          </thead>
          <tbody>
            {sortedEvents.map((event) => (
              <tr key={event.id}>
                <td>{event.name}</td>
                <td>{event.club.name}</td>
                <td>{new Date(event.startsAt).toLocaleString()}</td>
                <td>{new Date(event.endsAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  )
}