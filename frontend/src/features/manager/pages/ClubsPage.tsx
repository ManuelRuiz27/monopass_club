import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { managerApi, type ClubDTO } from '../api'
import { useToast } from '@/components/ToastProvider'

const initialFormState = { name: 'Nuevo club', capacity: 400 }

export function ClubsPage() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const clubsQuery = useQuery({ queryKey: ['clubs'], queryFn: managerApi.getClubs })
  const [form, setForm] = useState(initialFormState)
  const [editingClubId, setEditingClubId] = useState<string | null>(null)

  const editingClub = useMemo(() => clubsQuery.data?.find((club) => club.id === editingClubId) ?? null, [clubsQuery.data, editingClubId])

  useEffect(() => {
    if (editingClub) {
      setForm({ name: editingClub.name, capacity: editingClub.capacity })
    } else {
      setForm(initialFormState)
    }
  }, [editingClub])

  const createMutation = useMutation({
    mutationFn: managerApi.createClub,
    onSuccess: () => {
      toast.showToast({ title: 'Club creado', variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['clubs'] })
      setForm(initialFormState)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ clubId, payload }: { clubId: string; payload: Partial<ClubDTO> }) => managerApi.updateClub(clubId, payload),
    onSuccess: () => {
      toast.showToast({ title: 'Club actualizado', variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['clubs'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (clubId: string) => managerApi.deleteClub(clubId),
    onSuccess: () => {
      toast.showToast({ title: 'Club eliminado', variant: 'info' })
      queryClient.invalidateQueries({ queryKey: ['clubs'] })
    },
  })

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.name.trim()) return
    if (editingClub) {
      updateMutation.mutate({ clubId: editingClub.id, payload: { name: form.name.trim(), capacity: form.capacity } })
      setEditingClubId(null)
    } else {
      createMutation.mutate({ name: form.name.trim(), capacity: form.capacity })
    }
  }

  const handleToggleStatus = (club: ClubDTO) => {
    const confirmMessage = club.active
      ? 'El club quedara inactivo y no podra crear eventos nuevos. Continuar?'
      : 'Activar este club?'
    if (!window.confirm(confirmMessage)) return
    updateMutation.mutate({ clubId: club.id, payload: { active: !club.active } })
  }

  const handleDelete = (club: ClubDTO) => {
    if (!window.confirm('Esta accion eliminara el club y sus eventos. Continuar?')) return
    deleteMutation.mutate(club.id)
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <div>
      <h3>Clubs</h3>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Nombre
          <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required />
        </label>
        <label>
          Capacidad
          <input
            type="number"
            min={50}
            value={form.capacity}
            onChange={(e) => setForm((prev) => ({ ...prev, capacity: Number(e.target.value) }))}
            required
          />
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : editingClub ? 'Guardar cambios' : 'Crear club'}
          </button>
          {editingClub ? (
            <button type="button" className="button--ghost" onClick={() => setEditingClubId(null)}>
              Cancelar edicion
            </button>
          ) : null}
        </div>
      </form>

      {clubsQuery.isLoading ? <p>Cargando clubs...</p> : null}
      {clubsQuery.error ? <p className="text-danger">No pudimos cargar los clubs.</p> : null}

      {clubsQuery.data && clubsQuery.data.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Capacidad</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clubsQuery.data.map((club) => (
              <tr key={club.id}>
                <td>{club.name}</td>
                <td>{club.capacity}</td>
                <td>
                  <span className={`badge ${club.active ? 'badge--success' : 'badge--danger'}`}>
                    {club.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => setEditingClubId(club.id)}>
                    Editar
                  </button>
                  <button type="button" onClick={() => handleToggleStatus(club)}>
                    {club.active ? 'Desactivar' : 'Activar'}
                  </button>
                  <button type="button" onClick={() => handleDelete(club)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : clubsQuery.isSuccess ? (
        <p>No hay clubs registrados todavia.</p>
      ) : null}
    </div>
  )
}
