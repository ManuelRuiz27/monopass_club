import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { managerApi } from '../api'
import { useToast } from '@/components/ToastProvider'
import { Modal } from '@/components/Modal'

export function RpGroupsPage() {
    const toast = useToast()
    const queryClient = useQueryClient()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingGroupId, setEditingGroupId] = useState<string | null>(null)

    // Form State
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
        onError: () => toast.showToast({ title: 'Error al crear grupo', variant: 'error' })
    })

    const updateMutation = useMutation({
        mutationFn: (data: { id: string; payload: { name: string; memberIds: string[] } }) =>
            managerApi.updateRpGroup(data.id, data.payload),
        onSuccess: () => {
            toast.showToast({ title: 'Grupo actualizado', variant: 'success' })
            queryClient.invalidateQueries({ queryKey: ['rp-groups'] })
            closeModal()
        },
        onError: () => toast.showToast({ title: 'Error al actualizar grupo', variant: 'error' })
    })

    const deleteMutation = useMutation({
        mutationFn: managerApi.deleteRpGroup,
        onSuccess: () => {
            toast.showToast({ title: 'Grupo eliminado', variant: 'info' })
            queryClient.invalidateQueries({ queryKey: ['rp-groups'] })
        },
    })

    const openCreateModal = () => {
        setEditingGroupId(null)
        setGroupName('')
        setSelectedRpIds(new Set())
        setIsModalOpen(true)
    }

    const openEditModal = (group: any) => {
        setEditingGroupId(group.id)
        setGroupName(group.name)
        setSelectedRpIds(new Set(group.members.map((m: any) => m.id)))
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setEditingGroupId(null)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const memberIds = Array.from(selectedRpIds)

        if (editingGroupId) {
            updateMutation.mutate({ id: editingGroupId, payload: { name: groupName, memberIds } })
        } else {
            createMutation.mutate({ name: groupName, memberIds })
        }
    }

    const toggleRp = (rpId: string) => {
        const newSet = new Set(selectedRpIds)
        if (newSet.has(rpId)) {
            newSet.delete(rpId)
        } else {
            newSet.add(rpId)
        }
        setSelectedRpIds(newSet)
    }

    const isLoading = groupsQuery.isLoading || rpsQuery.isLoading
    const rps = rpsQuery.data?.filter(rp => rp.active) ?? []

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h4 style={{ margin: 0 }}>Grupos de RPs</h4>
                <button onClick={openCreateModal}>+ Nuevo Grupo</button>
            </div>

            {isLoading && <p className="text-muted">Cargando...</p>}

            <div className="card-grid">
                {groupsQuery.data?.map(group => (
                    <article key={group.id} className="card">
                        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{group.name}</h3>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="button--ghost" style={{ padding: '0.25rem' }} onClick={() => openEditModal(group)}>✏️</button>
                                <button
                                    className="button--ghost"
                                    style={{ padding: '0.25rem', color: 'var(--accent-error)' }}
                                    onClick={() => {
                                        if (confirm('¿Eliminar grupo?')) deleteMutation.mutate(group.id)
                                    }}
                                >
                                    🗑️
                                </button>
                            </div>
                        </header>
                        <p className="text-muted" style={{ fontSize: '0.9rem' }}>
                            {group.members.length} miembros
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.5rem' }}>
                            {group.members.slice(0, 5).map(m => (
                                <span key={m.id} className="badge badge--info" style={{ fontSize: '0.7rem' }}>
                                    {m.user.name.split(' ')[0]}
                                </span>
                            ))}
                            {group.members.length > 5 && (
                                <span className="badge" style={{ fontSize: '0.7rem' }}>+{group.members.length - 5}</span>
                            )}
                        </div>
                    </article>
                ))}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingGroupId ? 'Editar Grupo' : 'Nuevo Grupo'}
            >
                <form onSubmit={handleSubmit} className="form-grid">
                    <label>
                        Nombre del grupo
                        <input
                            type="text"
                            value={groupName}
                            onChange={e => setGroupName(e.target.value)}
                            placeholder="Ej. RPs VIP"
                            required
                        />
                    </label>

                    <label>
                        Seleccionar Miembros
                        <div
                            style={{
                                border: '1px solid var(--border-subtle)',
                                borderRadius: 'var(--radius-sm)',
                                maxHeight: '300px',
                                overflowY: 'auto',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                                gap: '0.5rem',
                                padding: '0.5rem',
                                background: 'var(--bg-input)'
                            }}
                        >
                            {rps.map(rp => {
                                const isSelected = selectedRpIds.has(rp.id)
                                return (
                                    <div
                                        key={rp.id}
                                        onClick={() => toggleRp(rp.id)}
                                        style={{
                                            padding: '0.5rem',
                                            borderRadius: 'var(--radius-sm)',
                                            border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-subtle)'}`,
                                            background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => { }}
                                            style={{ pointerEvents: 'none' }} // handled by parent div
                                        />
                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {rp.user.name}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </label>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {selectedRpIds.size} seleccionados
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" className="button--ghost" onClick={closeModal}>Cancelar</button>
                        <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                            {editingGroupId ? 'Guardar Cambios' : 'Crear Grupo'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
