import { useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { managerApi, type RpGroupDTO } from '../api'
import { useToast } from '@/components/ToastProvider'
import { Modal } from '@/components/Modal'
import { Button, CardEmptyState, PageErrorState, PageLoadingState } from '@/components/ui'

export function RpGroupsPage() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)

  const [groupName, setGroupName] = useState('')
  const [selectedRpIds, setSelectedRpIds] = useState<Set<string>>(new Set())

  const groupsQuery = useQuery({ queryKey: ['rp-groups'], queryFn: managerApi.getRpGroups })
  const rpsQuery = useQuery({ queryKey: ['rps'], queryFn: managerApi.getRps })

  const createMutation = useMutation({
    mutationFn: managerApi.createRpGroup,
    onSuccess: () => {
      toast.showToast({ title: 'Grupo creado', variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['rp-groups'] })
      closeModal()
    },
    onError: () => toast.showToast({ title: 'Error al crear grupo', variant: 'error' }),
  })

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; payload: { name: string; memberIds: string[] } }) =>
      managerApi.updateRpGroup(data.id, data.payload),
    onSuccess: () => {
      toast.showToast({ title: 'Grupo actualizado', variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['rp-groups'] })
      closeModal()
    },
    onError: () => toast.showToast({ title: 'Error al actualizar grupo', variant: 'error' }),
  })

  const deleteMutation = useMutation({
    mutationFn: managerApi.deleteRpGroup,
    onSuccess: () => {
      toast.showToast({ title: 'Grupo eliminado', variant: 'info' })
      queryClient.invalidateQueries({ queryKey: ['rp-groups'] })
    },
  })

  const rps = useMemo(() => rpsQuery.data?.filter((rp) => rp.active) ?? [], [rpsQuery.data])
  const groups = useMemo(() => groupsQuery.data ?? [], [groupsQuery.data])
  const isLoading = groupsQuery.isLoading || rpsQuery.isLoading
  const isSaving = createMutation.isPending || updateMutation.isPending
  const canRenderList = groupsQuery.isSuccess

  const openCreateModal = () => {
    setEditingGroupId(null)
    setGroupName('')
    setSelectedRpIds(new Set())
    setIsModalOpen(true)
  }

  const openEditModal = (group: RpGroupDTO) => {
    setEditingGroupId(group.id)
    setGroupName(group.name)
    setSelectedRpIds(new Set(group.members.map((member) => member.id)))
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingGroupId(null)
    setGroupName('')
    setSelectedRpIds(new Set())
  }

  const toggleRp = (rpId: string) => {
    setSelectedRpIds((previous) => {
      const next = new Set(previous)
      if (next.has(rpId)) next.delete(rpId)
      else next.add(rpId)
      return next
    })
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!groupName.trim()) return

    const memberIds = Array.from(selectedRpIds)
    if (memberIds.length === 0) {
      toast.showToast({ title: 'Selecciona al menos un RP', variant: 'error' })
      return
    }

    if (editingGroupId) {
      updateMutation.mutate({ id: editingGroupId, payload: { name: groupName.trim(), memberIds } })
      return
    }

    createMutation.mutate({ name: groupName.trim(), memberIds })
  }

  const handleDelete = (group: RpGroupDTO) => {
    if (!window.confirm('Eliminar grupo?')) return
    deleteMutation.mutate(group.id)
  }

  const showEmpty = groupsQuery.isSuccess && groups.length === 0

  return (
    <div className="manager-rpgroups-page">
      <header className="manager-rpgroups-page__header">
        <div>
          <h3 className="manager-rpgroups-page__title">Grupos de RPs</h3>
          <p className="text-muted manager-rpgroups-page__subtitle">Crea grupos para organizar equipos de relaciones publicas.</p>
        </div>
        <Button type="button" onClick={openCreateModal}>
          Nuevo Grupo
        </Button>
      </header>

      {isLoading ? <PageLoadingState message="Cargando grupos..." /> : null}
      {groupsQuery.error ? <PageErrorState description="No se pudieron cargar los grupos." /> : null}

      {showEmpty ? (
        <CardEmptyState
          title="Todavia no hay grupos"
          description="Crea tu primer grupo para gestionar miembros en bloque."
          actionLabel="Crear primer grupo"
          onAction={openCreateModal}
        />
      ) : null}

      {canRenderList && !showEmpty ? (
        <>
          <div className="manager-rpgroups-table-wrap">
            <table className="manager-rpgroups-table">
              <thead>
                <tr>
                  <th>Grupo</th>
                  <th>Miembros</th>
                  <th>Vista rapida</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <tr key={group.id}>
                    <td>{group.name}</td>
                    <td>{group.members.length}</td>
                    <td>
                      <div className="manager-rpgroups-members-preview">
                        {group.members.slice(0, 4).map((member) => (
                          <span key={member.id} className="badge badge--info">
                            {member.user.name.split(' ')[0]}
                          </span>
                        ))}
                        {group.members.length > 4 ? <span className="badge">+{group.members.length - 4}</span> : null}
                      </div>
                    </td>
                    <td>
                      <div className="manager-rpgroups-actions">
                        <Button type="button" size="sm" variant="secondary" onClick={() => openEditModal(group)}>
                          Editar
                        </Button>
                        <Button type="button" size="sm" variant="danger" onClick={() => handleDelete(group)}>
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="manager-rpgroups-mobile-list">
            {groups.map((group) => (
              <article key={`mobile-${group.id}`} className="card manager-rpgroups-mobile-card">
                <header className="manager-rpgroups-mobile-card__header">
                  <h4 className="manager-rpgroups-mobile-card__title">{group.name}</h4>
                  <span className="badge badge--info">{group.members.length} miembros</span>
                </header>
                <div className="manager-rpgroups-members-preview">
                  {group.members.slice(0, 4).map((member) => (
                    <span key={`mobile-${group.id}-${member.id}`} className="badge">
                      {member.user.name.split(' ')[0]}
                    </span>
                  ))}
                  {group.members.length > 4 ? <span className="badge">+{group.members.length - 4}</span> : null}
                </div>
                <div className="manager-rpgroups-actions manager-rpgroups-actions--mobile">
                  <Button type="button" size="sm" variant="secondary" onClick={() => openEditModal(group)}>
                    Editar
                  </Button>
                  <Button type="button" size="sm" variant="danger" onClick={() => handleDelete(group)}>
                    Eliminar
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : null}

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingGroupId ? 'Editar Grupo' : 'Nuevo Grupo'}>
        <form onSubmit={handleSubmit} className="form-grid manager-rpgroups-form">
          <label>
            Nombre del grupo
            <input
              type="text"
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              placeholder="Ej. RPs VIP"
              required
            />
          </label>

          <label>
            Seleccionar miembros
            <div className="manager-rpgroups-members-grid">
              {rps.map((rp) => {
                const isSelected = selectedRpIds.has(rp.id)
                return (
                  <button
                    key={rp.id}
                    type="button"
                    className={`manager-rpgroups-member-option ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => toggleRp(rp.id)}
                    aria-pressed={isSelected}
                  >
                    <input type="checkbox" checked={isSelected} readOnly tabIndex={-1} />
                    <span>{rp.user.name}</span>
                  </button>
                )
              })}
            </div>
          </label>

          <p className="text-muted manager-rpgroups-form__counter">{selectedRpIds.size} seleccionados</p>

          <div className="manager-rpgroups-form__actions">
            <Button type="button" variant="ghost" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" loading={isSaving}>
              {editingGroupId ? 'Guardar Cambios' : 'Crear Grupo'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
