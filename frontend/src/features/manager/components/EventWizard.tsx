import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { managerApi, type ClubDTO, type RpDTO } from '../api'
import { useToast } from '@/components/ToastProvider'
import { TemplateEditor, type TemplateConfig } from '@/components/TemplateEditor'

type WizardStep = 'basics' | 'design' | 'rps' | 'confirm'

// Exportamos el tipo para usarlo fuera
export type EventFormData = {
    clubId: string
    name: string
    startsAt: string
    endsAt: string
    template: TemplateConfig
    rpAssignments: Array<{ rpId: string; limit: string }>
}

const defaultFormData = (): EventFormData => ({
    clubId: '',
    name: 'Evento especial',
    startsAt: new Date().toISOString().slice(0, 16),
    endsAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString().slice(0, 16),
    template: {
        templateImageUrl: '',
        qrPositionX: 0.5,
        qrPositionY: 0.5,
        qrSize: 0.35,
    },
    rpAssignments: [],
})

const steps: { key: WizardStep; label: string; icon: string }[] = [
    { key: 'basics', label: 'Datos básicos', icon: '📝' },
    { key: 'design', label: 'Diseño', icon: '🎨' },
    { key: 'rps', label: 'Asignar RPs', icon: '👥' },
    { key: 'confirm', label: 'Confirmar', icon: '✓' },
]

type EventWizardProps = {
    onComplete: () => void
    onCancel: () => void
    initialData?: Partial<EventFormData>
}

export function EventWizard({ onComplete, onCancel, initialData }: EventWizardProps) {
    const toast = useToast()
    const queryClient = useQueryClient()
    const [currentStep, setCurrentStep] = useState<WizardStep>('basics')
    const [formData, setFormData] = useState<EventFormData>({ ...defaultFormData(), ...initialData })

    const clubsQuery = useQuery({ queryKey: ['clubs'], queryFn: managerApi.getClubs })
    const rpsQuery = useQuery({ queryKey: ['rps'], queryFn: managerApi.getRps })
    const groupsQuery = useQuery({ queryKey: ['rp-groups'], queryFn: managerApi.getRpGroups })

    const loadGroup = (groupId: string) => {
        const group = groupsQuery.data?.find(g => g.id === groupId)
        if (!group) return

        setFormData(prev => {
            const currentIds = new Set(prev.rpAssignments.map(a => a.rpId))
            const updates = [...prev.rpAssignments]
            let addedCount = 0

            group.members.forEach(m => {
                const rpIsActive = rpsQuery.data?.some(rp => rp.id === m.id && rp.active)
                if (!currentIds.has(m.id) && rpIsActive) {
                    updates.push({ rpId: m.id, limit: '' })
                    addedCount++
                }
            })

            if (addedCount > 0) {
                toast.showToast({ title: `${addedCount} RPs añadidos del grupo`, variant: 'success' })
            } else {
                toast.showToast({ title: 'Los RPs del grupo ya estaban seleccionados', variant: 'info' })
            }

            return { ...prev, rpAssignments: updates }
        })
    }

    const createEventMutation = useMutation({
        mutationFn: () =>
            managerApi.createEvent({
                clubId: formData.clubId,
                name: formData.name.trim(),
                startsAt: new Date(formData.startsAt).toISOString(),
                endsAt: new Date(formData.endsAt).toISOString(),
            }),
        onSuccess: (event) => {
            // Guardar plantilla si hay imagen
            if (formData.template.templateImageUrl) {
                updateTemplateMutation.mutate({ eventId: event.id })
            } else if (formData.rpAssignments.length > 0) {
                // Asignar RPs
                assignRpsMutation.mutate({ eventId: event.id })
            } else {
                finishWizard()
            }
        },
        onError: (err: unknown) => {
            toast.showToast({
                title: 'Error al crear evento',
                description: err instanceof Error ? err.message : undefined,
                variant: 'error',
            })
        },
    })

    const updateTemplateMutation = useMutation({
        mutationFn: ({ eventId }: { eventId: string }) =>
            managerApi.updateTemplate(eventId, {
                templateImageUrl: formData.template.templateImageUrl || null,
                qrPositionX: formData.template.qrPositionX,
                qrPositionY: formData.template.qrPositionY,
                qrSize: formData.template.qrSize,
            }),
        onSuccess: (_, variables) => {
            if (formData.rpAssignments.length > 0) {
                assignRpsMutation.mutate({ eventId: variables.eventId })
            } else {
                finishWizard()
            }
        },
        onError: () => {
            toast.showToast({ title: 'Evento creado pero hubo un error con la plantilla', variant: 'info' })
            finishWizard()
        },
    })

    const assignRpsMutation = useMutation({
        mutationFn: async ({ eventId }: { eventId: string }) => {
            for (const assignment of formData.rpAssignments) {
                const limit = assignment.limit ? Number(assignment.limit) : null
                await managerApi.assignRpToEvent(eventId, { rpId: assignment.rpId, limitAccesses: limit })
            }
        },
        onSuccess: () => {
            finishWizard()
        },
        onError: () => {
            toast.showToast({ title: 'Evento creado pero hubo un error al asignar RPs', variant: 'info' })
            finishWizard()
        },
    })

    const finishWizard = () => {
        toast.showToast({ title: '🎉 Evento creado exitosamente', variant: 'success' })
        queryClient.invalidateQueries({ queryKey: ['events'] })
        onComplete()
    }

    const isLoading = createEventMutation.isPending || updateTemplateMutation.isPending || assignRpsMutation.isPending

    const currentStepIndex = steps.findIndex((s) => s.key === currentStep)

    const canProceed = () => {
        switch (currentStep) {
            case 'basics':
                return formData.clubId && formData.name.trim() && formData.startsAt && formData.endsAt
            case 'design':
                return true // Optional step
            case 'rps':
                return true // Optional step
            case 'confirm':
                return true
            default:
                return false
        }
    }

    const goNext = () => {
        const nextIndex = currentStepIndex + 1
        if (nextIndex < steps.length) {
            setCurrentStep(steps[nextIndex].key)
        }
    }

    const goPrev = () => {
        const prevIndex = currentStepIndex - 1
        if (prevIndex >= 0) {
            setCurrentStep(steps[prevIndex].key)
        }
    }

    const handleSubmit = () => {
        createEventMutation.mutate()
    }

    const toggleRpAssignment = (rpId: string) => {
        setFormData((prev) => {
            const exists = prev.rpAssignments.find((a) => a.rpId === rpId)
            if (exists) {
                return { ...prev, rpAssignments: prev.rpAssignments.filter((a) => a.rpId !== rpId) }
            }
            return { ...prev, rpAssignments: [...prev.rpAssignments, { rpId, limit: '' }] }
        })
    }

    const updateRpLimit = (rpId: string, limit: string) => {
        setFormData((prev) => ({
            ...prev,
            rpAssignments: prev.rpAssignments.map((a) => (a.rpId === rpId ? { ...a, limit } : a)),
        }))
    }

    const selectedClub = clubsQuery.data?.find((c) => c.id === formData.clubId)

    return (
        <div className="event-wizard">
            {/* Progress bar */}
            <div className="wizard-progress">
                {steps.map((step, index) => (
                    <div
                        key={step.key}
                        className={`wizard-step ${currentStep === step.key ? 'wizard-step--active' : ''} ${index < currentStepIndex ? 'wizard-step--completed' : ''}`}
                    >
                        <span className="wizard-step__icon">{index < currentStepIndex ? '✓' : step.icon}</span>
                        <span className="wizard-step__label">{step.label}</span>
                    </div>
                ))}
            </div>

            {/* Step content */}
            <div className="wizard-content">
                {currentStep === 'basics' && (
                    <div>
                        <h3>Datos del evento</h3>
                        <div className="form-grid">
                            <label>
                                Club
                                <select
                                    value={formData.clubId}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, clubId: e.target.value }))}
                                    required
                                >
                                    <option value="" disabled>
                                        Selecciona un club
                                    </option>
                                    {clubsQuery.data?.map((club: ClubDTO) => (
                                        <option key={club.id} value={club.id} disabled={!club.active}>
                                            {club.name} {!club.active ? '(Inactivo)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                Nombre del evento
                                <input
                                    value={formData.name}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                    required
                                />
                            </label>
                            <label>
                                Inicio
                                <input
                                    type="datetime-local"
                                    value={formData.startsAt}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, startsAt: e.target.value }))}
                                    required
                                />
                            </label>
                            <label>
                                Fin
                                <input
                                    type="datetime-local"
                                    value={formData.endsAt}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, endsAt: e.target.value }))}
                                    required
                                />
                            </label>
                        </div>
                    </div>
                )}

                {currentStep === 'design' && (
                    <div>
                        <h3>Diseño del acceso</h3>
                        <p className="text-muted" style={{ marginTop: 0 }}>
                            Opcional: sube una imagen de fondo y posiciona el código QR.
                        </p>
                        <TemplateEditor
                            initialConfig={formData.template}
                            onSave={(config) => {
                                setFormData((prev) => ({ ...prev, template: config }))
                                goNext()
                            }}
                            onCancel={goNext}
                            eventName={formData.name}
                        />
                    </div>
                )}

                {currentStep === 'rps' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3>Asignar RPs</h3>
                            {groupsQuery.data && groupsQuery.data.length > 0 && (
                                <select
                                    onChange={(e) => {
                                        loadGroup(e.target.value)
                                        e.target.value = '' // Reset
                                    }}
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.9rem', width: 'auto' }}
                                >
                                    <option value="">📂 Cargar Grupo...</option>
                                    {groupsQuery.data.map(g => (
                                        <option key={g.id} value={g.id}>{g.name} ({g.members.length})</option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <p className="text-muted" style={{ marginTop: 0 }}>
                            Selecciona los RPs que podrán generar accesos para este evento.
                        </p>
                        {rpsQuery.data?.filter((rp: RpDTO) => rp.active).length === 0 ? (
                            <p className="text-warning">No hay RPs activos. Puedes crear el evento y asignarlos después.</p>
                        ) : (
                            <div className="rp-selection-grid">
                                {rpsQuery.data
                                    ?.filter((rp: RpDTO) => rp.active)
                                    .map((rp: RpDTO) => {
                                        const isSelected = formData.rpAssignments.some((a) => a.rpId === rp.id)
                                        const assignment = formData.rpAssignments.find((a) => a.rpId === rp.id)
                                        return (
                                            <div
                                                key={rp.id}
                                                className={`rp-selection-card ${isSelected ? 'rp-selection-card--selected' : ''}`}
                                                onClick={() => toggleRpAssignment(rp.id)}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <strong>{rp.user.name}</strong>
                                                    <input type="checkbox" checked={isSelected} readOnly />
                                                </div>
                                                <p className="text-muted" style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>
                                                    {rp.user.username}
                                                </p>
                                                {isSelected && (
                                                    <div style={{ marginTop: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                                                        <input
                                                            type="number"
                                                            placeholder="Límite (opcional)"
                                                            value={assignment?.limit ?? ''}
                                                            onChange={(e) => updateRpLimit(rp.id, e.target.value)}
                                                            min={1}
                                                            style={{ width: '100%', padding: '0.5rem' }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                            </div>
                        )}
                    </div>
                )}

                {currentStep === 'confirm' && (
                    <div>
                        <h3>Confirmar evento</h3>
                        <div className="confirm-summary">
                            <div className="confirm-item">
                                <span className="text-muted">Club:</span>
                                <strong>{selectedClub?.name ?? '-'}</strong>
                            </div>
                            <div className="confirm-item">
                                <span className="text-muted">Evento:</span>
                                <strong>{formData.name}</strong>
                            </div>
                            <div className="confirm-item">
                                <span className="text-muted">Inicio:</span>
                                <strong>{new Date(formData.startsAt).toLocaleString()}</strong>
                            </div>
                            <div className="confirm-item">
                                <span className="text-muted">Fin:</span>
                                <strong>{new Date(formData.endsAt).toLocaleString()}</strong>
                            </div>
                            <div className="confirm-item">
                                <span className="text-muted">Plantilla:</span>
                                <strong>{formData.template.templateImageUrl ? '✓ Configurada' : '⚠ Sin imagen'}</strong>
                            </div>
                            <div className="confirm-item">
                                <span className="text-muted">RPs asignados:</span>
                                <strong>
                                    {formData.rpAssignments.length > 0
                                        ? `${formData.rpAssignments.length} RP(s)`
                                        : '⚠ Ninguno (puedes asignar después)'}
                                </strong>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation */}
            {currentStep !== 'design' && (
                <div className="wizard-nav">
                    {currentStepIndex > 0 && (
                        <button type="button" className="button--ghost" onClick={goPrev} disabled={isLoading}>
                            ← Anterior
                        </button>
                    )}
                    <div style={{ flex: 1 }} />
                    {currentStep === 'confirm' ? (
                        <button type="button" onClick={handleSubmit} disabled={isLoading || !canProceed()}>
                            {isLoading ? '⏳ Creando...' : '🚀 Crear evento'}
                        </button>
                    ) : (
                        <button type="button" onClick={goNext} disabled={!canProceed()}>
                            Siguiente →
                        </button>
                    )}
                    <button type="button" className="button--ghost" onClick={onCancel} disabled={isLoading}>
                        Cancelar
                    </button>
                </div>
            )}
        </div>
    )
}
