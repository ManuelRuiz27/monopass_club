import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { managerApi, type ScannerDTO } from '../api'
import { useToast } from '@/components/ToastProvider'

const defaultForm = { name: 'Scanner', username: '', password: 'changeme123' }

export function ScannerStaffPage() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const scannersQuery = useQuery({ queryKey: ['scanners'], queryFn: managerApi.getScanners })
  const [form, setForm] = useState(defaultForm)

  const createScanner = useMutation({
    mutationFn: () => managerApi.createScanner(form),
    onSuccess: () => {
      toast.showToast({ title: 'Scanner creado', variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['scanners'] })
      setForm(defaultForm)
    },
  })

  const updateScanner = useMutation({
    mutationFn: ({ scannerId, payload }: { scannerId: string; payload: { active?: boolean; name?: string } }) =>
      managerApi.updateScanner(scannerId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scanners'] }),
  })

  const handleToggle = (scanner: ScannerDTO) => {
    const message = scanner.active ? 'Desactivar scanner impedira validar QR. Continuar?' : 'Activar scanner?'
    if (!window.confirm(message)) return
    updateScanner.mutate({ scannerId: scanner.id, payload: { active: !scanner.active } })
  }

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
          Password temporal
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            required
          />
        </label>
        <button type="submit" disabled={createScanner.isPending}>
          {createScanner.isPending ? 'Creando...' : 'Crear scanner'}
        </button>
      </form>

      {scannersQuery.isLoading ? <p>Cargando scanners...</p> : null}
      {scannersQuery.error ? <p className="text-danger">No se pudo cargar el staff.</p> : null}

      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Usuario</th>
            <th>Estado</th>
            <th>Ultima actividad</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {scannersQuery.data?.map((scanner) => (
            <tr key={scanner.id}>
              <td>{scanner.user.name}</td>
              <td>{scanner.user.username}</td>
              <td>
                <span className={`badge ${scanner.active ? 'badge--success' : 'badge--danger'}`}>
                  {scanner.active ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td>{scanner.lastScanAt ? new Date(scanner.lastScanAt).toLocaleString() : 'Sin registros'}</td>
              <td>
                <button type="button" onClick={() => handleToggle(scanner)}>
                  {scanner.active ? 'Desactivar' : 'Activar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
