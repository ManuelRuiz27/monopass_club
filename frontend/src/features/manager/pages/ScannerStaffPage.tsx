import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { managerApi } from '../api'

export function ScannerStaffPage() {
  const queryClient = useQueryClient()
  const scannersQuery = useQuery({ queryKey: ['scanners'], queryFn: managerApi.getScanners })
  const [form, setForm] = useState({ name: 'Scanner', username: '', password: 'changeme123' })

  const createScanner = useMutation({
    mutationFn: () => managerApi.createScanner(form),
    onSuccess: () => {
      setForm({ name: '', username: '', password: 'changeme123' })
      queryClient.invalidateQueries({ queryKey: ['scanners'] })
    },
  })

  return (
    <div>
      <h3>Staff Scanner</h3>
      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault()
          createScanner.mutate()
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
          Password
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            required
          />
        </label>
        <button type="submit" disabled={createScanner.isPending}>
          {createScanner.isPending ? 'Creando…' : 'Crear usuario scanner'}
        </button>
      </form>

      {scannersQuery.data ? (
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Usuario</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {scannersQuery.data.map((scanner) => (
              <tr key={scanner.id}>
                <td>{scanner.user.name}</td>
                <td>{scanner.user.username}</td>
                <td>
                  <span className="badge">{scanner.active ? 'Activo' : 'Inactivo'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  )
}