import { useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { managerApi, type ClubDTO } from '../api'
import { useToast } from '@/components/ToastProvider'
import { BottomSheet, Button, CardEmptyState, PageErrorState, PageLoadingState } from '@/components/ui'

const initialFormState = { name: 'Nuevo club', capacity: 400 }

export function ClubsPage() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const clubsQuery = useQuery({ queryKey: ['clubs'], queryFn: managerApi.getClubs })
  const [form, setForm] = useState(initialFormState)
  const [editingClubId, setEditingClubId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [pendingStatusFilter, setPendingStatusFilter] = useState('')
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)

  const editingClub = useMemo(() => clubsQuery.data?.find((club) => club.id === editingClubId) ?? null, [clubsQuery.data, editingClubId])

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

  const filteredClubs = useMemo(() => {
    const clubs = clubsQuery.data ?? []
    if (statusFilter === 'active') return clubs.filter((club) => club.active)
    if (statusFilter === 'inactive') return clubs.filter((club) => !club.active)
    return clubs
  }, [clubsQuery.data, statusFilter])

  const hasFilter = Boolean(statusFilter)
  const showEmpty = clubsQuery.isSuccess && filteredClubs.length === 0
  const canRenderList = clubsQuery.isSuccess

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!form.name.trim()) return
    if (editingClub) {
      updateMutation.mutate({ clubId: editingClub.id, payload: { name: form.name.trim(), capacity: form.capacity } })
      setEditingClubId(null)
      setForm(initialFormState)
    } else {
      createMutation.mutate({ name: form.name.trim(), capacity: form.capacity })
    }
  }

  const handleStartEdit = (club: ClubDTO) => {
    setEditingClubId(club.id)
    setForm({ name: club.name, capacity: club.capacity })
  }

  const handleCancelEdit = () => {
    setEditingClubId(null)
    setForm(initialFormState)
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
    <div className="manager-clubs-page">
      <header className="manager-clubs-page__header">
        <div>
          <h3 className="manager-clubs-page__title">Clubs</h3>
          <p className="text-muted manager-clubs-page__subtitle">Gestiona capacidad y disponibilidad de los clubs.</p>
        </div>
      </header>

      <section className="card manager-clubs-form-card">
        <h4 className="manager-clubs-form-card__title">{editingClub ? 'Editar club' : 'Crear club'}</h4>
        <form className="form-grid manager-clubs-form" onSubmit={handleSubmit}>
          <label>
            Nombre
            <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} required />
          </label>
          <label>
            Capacidad
            <input
              type="number"
              min={50}
              value={form.capacity}
              onChange={(event) => setForm((prev) => ({ ...prev, capacity: Number(event.target.value) }))}
              required
            />
          </label>
          <div className="manager-clubs-form__actions">
            <Button type="submit" loading={isSubmitting}>
              {isSubmitting ? 'Guardando...' : editingClub ? 'Guardar cambios' : 'Crear club'}
            </Button>
            {editingClub ? (
              <Button type="button" variant="ghost" onClick={handleCancelEdit}>
                Cancelar edicion
              </Button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="manager-clubs-toolbar">
        <div className="manager-clubs-toolbar__mobile">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setPendingStatusFilter(statusFilter)
              setIsFilterSheetOpen(true)
            }}
          >
            Filtrar
          </Button>
          {hasFilter ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => setStatusFilter('')}>
              Limpiar
            </Button>
          ) : null}
        </div>

        <div className="manager-clubs-toolbar__desktop">
          <label>
            Estado
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </label>
          <Button type="button" variant="ghost" size="sm" onClick={() => setStatusFilter('')}>
            Limpiar filtros
          </Button>
        </div>
      </section>

      {clubsQuery.isLoading ? <PageLoadingState message="Cargando clubs..." /> : null}
      {clubsQuery.error ? <PageErrorState description="No pudimos cargar los clubs." /> : null}

      {showEmpty ? (
        <CardEmptyState
          title="No hay clubs para este filtro"
          description="Ajusta el estado o limpia la busqueda para ver todos los clubs."
          actionLabel="Limpiar filtros"
          onAction={() => setStatusFilter('')}
        />
      ) : null}

      {canRenderList && !showEmpty ? (
        <>
          <div className="manager-clubs-table-wrap">
            <table className="manager-clubs-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Capacidad</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredClubs.map((club) => (
                  <tr key={club.id}>
                    <td>{club.name}</td>
                    <td>{club.capacity}</td>
                    <td>
                      <span className={`badge ${club.active ? 'badge--success' : 'badge--danger'}`}>
                        {club.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="manager-clubs-actions">
                        <Button type="button" size="sm" variant="secondary" onClick={() => handleStartEdit(club)}>
                          Editar
                        </Button>
                        <Button type="button" size="sm" variant="secondary" onClick={() => handleToggleStatus(club)}>
                          {club.active ? 'Desactivar' : 'Activar'}
                        </Button>
                        <Button type="button" size="sm" variant="danger" onClick={() => handleDelete(club)}>
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="manager-clubs-mobile-list">
            {filteredClubs.map((club) => (
              <article key={`mobile-${club.id}`} className="card manager-clubs-mobile-card">
                <header className="manager-clubs-mobile-card__header">
                  <div>
                    <h4 className="manager-clubs-mobile-card__title">{club.name}</h4>
                    <p className="text-muted manager-clubs-mobile-card__capacity">Capacidad: {club.capacity}</p>
                  </div>
                  <span className={`badge ${club.active ? 'badge--success' : 'badge--danger'}`}>
                    {club.active ? 'Activo' : 'Inactivo'}
                  </span>
                </header>
                <div className="manager-clubs-actions manager-clubs-actions--mobile">
                  <Button type="button" size="sm" variant="secondary" onClick={() => handleStartEdit(club)}>
                    Editar
                  </Button>
                  <Button type="button" size="sm" variant="secondary" onClick={() => handleToggleStatus(club)}>
                    {club.active ? 'Desactivar' : 'Activar'}
                  </Button>
                  <Button type="button" size="sm" variant="danger" onClick={() => handleDelete(club)}>
                    Eliminar
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : null}

      <BottomSheet
        open={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        title="Filtrar clubs"
        actions={
          <>
            <Button type="button" variant="secondary" onClick={() => setIsFilterSheetOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => {
                setStatusFilter(pendingStatusFilter)
                setIsFilterSheetOpen(false)
              }}
            >
              Aplicar
            </Button>
          </>
        }
      >
        <div className="form-grid manager-clubs-sheet">
          <label>
            Estado
            <select value={pendingStatusFilter} onChange={(event) => setPendingStatusFilter(event.target.value)}>
              <option value="">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </label>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setPendingStatusFilter('')
              setStatusFilter('')
              setIsFilterSheetOpen(false)
            }}
          >
            Limpiar filtros
          </Button>
        </div>
      </BottomSheet>
    </div>
  )
}
