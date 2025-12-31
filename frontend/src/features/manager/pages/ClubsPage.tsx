import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { managerApi } from '../api'

export function ClubsPage() {
  const queryClient = useQueryClient()
  const clubsQuery = useQuery({ queryKey: ['clubs'], queryFn: managerApi.getClubs })
  const [name, setName] = useState('Neo Club')
  const [capacity, setCapacity] = useState(400)

  const createClub = useMutation({
    mutationFn: managerApi.createClub,
    onSuccess: () => {
      setName('')
      setCapacity(0)
      queryClient.invalidateQueries({ queryKey: ['clubs'] })
    },
  })

  return (
    <div>
      <h3>Clubs</h3>
      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault()
          createClub.mutate({ name, capacity })
        }}
      >
        <label>
          Nombre
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Capacidad
          <input type="number" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} required />
        </label>
        <button type="submit" disabled={createClub.isPending}>
          {createClub.isPending ? 'Guardando…' : 'Crear club'}
        </button>
      </form>

      {clubsQuery.isLoading ? <p>Cargando clubs…</p> : null}
      {clubsQuery.error ? <p style={{ color: '#dc2626' }}>Error al cargar clubs</p> : null}

      {clubsQuery.data ? (
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Capacidad</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {clubsQuery.data.map((club) => (
              <tr key={club.id}>
                <td>{club.name}</td>
                <td>{club.capacity}</td>
                <td>
                  <span className="badge">{club.active ? 'Activo' : 'Inactivo'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  )
}