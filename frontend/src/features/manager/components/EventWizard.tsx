import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { managerApi, type ClubDTO, type RpDTO } from '../api'
import { useToast } from '@/components/ToastProvider'
import { TemplateEditor, type TemplateConfig } from '@/components/TemplateEditor'
import { Button } from '@/components/ui'

type WizardStep = 'basics' | 'design' | 'rps' | 'confirm'

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

const steps: Array<{ key: WizardStep; label: string; icon: string }> = [
  { key: 'basics', label: 'Datos basicos', icon: 'description' },
  { key: 'design', label: 'Diseno', icon: 'palette' },
  { key: 'rps', label: 'Asignar RPs', icon: 'groups' },
  { key: 'confirm', label: 'Confirmar', icon: 'task_alt' },
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
    const group = groupsQuery.data?.find((item) => item.id === groupId)
    if (!group) return

    setFormData((previous) => {
      const currentIds = new Set(previous.rpAssignments.map((assignment) => assignment.rpId))
      const nextAssignments = [...previous.rpAssignments]
      let addedCount = 0

      group.members.forEach((member) => {
        const rpIsActive = rpsQuery.data?.some((rp) => rp.id === member.id && rp.active)
        if (!currentIds.has(member.id) && rpIsActive) {
          nextAssignments.push({ rpId: member.id, limit: '' })
          addedCount += 1
        }
      })

      if (addedCount > 0) {
        toast.showToast({ title: `${addedCount} RPs anadidos del grupo`, variant: 'success' })
      } else {
        toast.showToast({ title: 'Los RPs del grupo ya estaban seleccionados', variant: 'info' })
      }

      return { ...previous, rpAssignments: nextAssignments }
    })
  }

  const finishWizard = () => {
    toast.showToast({ title: 'Evento creado exitosamente', variant: 'success' })
    queryClient.invalidateQueries({ queryKey: ['events'] })
    onComplete()
  }

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

  const createEventMutation = useMutation({
    mutationFn: () =>
      managerApi.createEvent({
        clubId: formData.clubId,
        name: formData.name.trim(),
        startsAt: new Date(formData.startsAt).toISOString(),
        endsAt: new Date(formData.endsAt).toISOString(),
      }),
    onSuccess: (event) => {
      if (formData.template.templateImageUrl) {
        updateTemplateMutation.mutate({ eventId: event.id })
      } else if (formData.rpAssignments.length > 0) {
        assignRpsMutation.mutate({ eventId: event.id })
      } else {
        finishWizard()
      }
    },
    onError: (error: unknown) => {
      toast.showToast({
        title: 'Error al crear evento',
        description: error instanceof Error ? error.message : undefined,
        variant: 'error',
      })
    },
  })

  const isLoading = createEventMutation.isPending || updateTemplateMutation.isPending || assignRpsMutation.isPending
  const currentStepIndex = steps.findIndex((step) => step.key === currentStep)

  const canProceed = () => {
    switch (currentStep) {
      case 'basics':
        return Boolean(formData.clubId && formData.name.trim() && formData.startsAt && formData.endsAt)
      case 'design':
      case 'rps':
      case 'confirm':
      default:
        return true
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
    setFormData((previous) => {
      const exists = previous.rpAssignments.some((assignment) => assignment.rpId === rpId)
      if (exists) {
        return { ...previous, rpAssignments: previous.rpAssignments.filter((assignment) => assignment.rpId !== rpId) }
      }
      return { ...previous, rpAssignments: [...previous.rpAssignments, { rpId, limit: '' }] }
    })
  }

  const updateRpLimit = (rpId: string, limit: string) => {
    setFormData((previous) => ({
      ...previous,
      rpAssignments: previous.rpAssignments.map((assignment) =>
        assignment.rpId === rpId ? { ...assignment, limit } : assignment,
      ),
    }))
  }

  const selectedClub = clubsQuery.data?.find((club) => club.id === formData.clubId)

  return (
    <div className="event-wizard">
      <div className="wizard-progress">
        {steps.map((step, index) => (
          <div
            key={step.key}
            className={`wizard-step ${currentStep === step.key ? 'wizard-step--active' : ''} ${index < currentStepIndex ? 'wizard-step--completed' : ''}`}
          >
            <span className="wizard-step__icon">
              <span className="material-symbols-outlined wizard-step__icon-symbol" aria-hidden="true">
                {index < currentStepIndex ? 'check' : step.icon}
              </span>
            </span>
            <span className="wizard-step__label">{step.label}</span>
          </div>
        ))}
      </div>

      <div className="wizard-content">
        {currentStep === 'basics' ? (
          <div>
            <h3>Datos del evento</h3>
            <div className="form-grid">
              <label>
                Club
                <select
                  value={formData.clubId}
                  onChange={(event) => setFormData((previous) => ({ ...previous, clubId: event.target.value }))}
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
                  onChange={(event) => setFormData((previous) => ({ ...previous, name: event.target.value }))}
                  required
                />
              </label>
              <label>
                Inicio
                <input
                  type="datetime-local"
                  value={formData.startsAt}
                  onChange={(event) => setFormData((previous) => ({ ...previous, startsAt: event.target.value }))}
                  required
                />
              </label>
              <label>
                Fin
                <input
                  type="datetime-local"
                  value={formData.endsAt}
                  onChange={(event) => setFormData((previous) => ({ ...previous, endsAt: event.target.value }))}
                  required
                />
              </label>
            </div>
          </div>
        ) : null}

        {currentStep === 'design' ? (
          <div>
            <h3>Diseno del acceso</h3>
            <p className="text-muted event-wizard-step__subtitle">
              Opcional: sube una imagen de fondo y posiciona el codigo QR.
            </p>
            <TemplateEditor
              initialConfig={formData.template}
              onSave={(config) => {
                setFormData((previous) => ({ ...previous, template: config }))
                goNext()
              }}
              onCancel={goNext}
              eventName={formData.name}
            />
          </div>
        ) : null}

        {currentStep === 'rps' ? (
          <div>
            <div className="event-wizard-rps__header">
              <h3>Asignar RPs</h3>
              {groupsQuery.data && groupsQuery.data.length > 0 ? (
                <select
                  className="event-wizard-rps__group-select"
                  onChange={(event) => {
                    loadGroup(event.target.value)
                    event.target.value = ''
                  }}
                >
                  <option value="">Cargar grupo...</option>
                  {groupsQuery.data.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name} ({group.members.length})
                    </option>
                  ))}
                </select>
              ) : null}
            </div>
            <p className="text-muted event-wizard-step__subtitle">
              Selecciona los RPs que podran generar accesos para este evento.
            </p>
            {rpsQuery.data?.filter((rp: RpDTO) => rp.active).length === 0 ? (
              <p className="text-warning">No hay RPs activos. Puedes crear el evento y asignarlos despues.</p>
            ) : (
              <div className="rp-selection-grid">
                {rpsQuery.data
                  ?.filter((rp: RpDTO) => rp.active)
                  .map((rp: RpDTO) => {
                    const isSelected = formData.rpAssignments.some((assignment) => assignment.rpId === rp.id)
                    const assignment = formData.rpAssignments.find((item) => item.rpId === rp.id)

                    return (
                      <div
                        key={rp.id}
                        className={`rp-selection-card ${isSelected ? 'rp-selection-card--selected' : ''}`}
                        onClick={() => toggleRpAssignment(rp.id)}
                      >
                        <div className="rp-selection-card__header">
                          <strong>{rp.user.name}</strong>
                          <input type="checkbox" checked={isSelected} readOnly />
                        </div>
                        <p className="text-muted rp-selection-card__username">{rp.user.username}</p>
                        {isSelected ? (
                          <div className="rp-selection-card__limit-wrap" onClick={(event) => event.stopPropagation()}>
                            <input
                              type="number"
                              className="rp-selection-card__limit"
                              placeholder="Limite (opcional)"
                              value={assignment?.limit ?? ''}
                              onChange={(event) => updateRpLimit(rp.id, event.target.value)}
                              min={1}
                            />
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        ) : null}

        {currentStep === 'confirm' ? (
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
                <strong>{formData.template.templateImageUrl ? 'Configurada' : 'Sin imagen'}</strong>
              </div>
              <div className="confirm-item">
                <span className="text-muted">RPs asignados:</span>
                <strong>
                  {formData.rpAssignments.length > 0 ? `${formData.rpAssignments.length} RP(s)` : 'Ninguno (puedes asignar despues)'}
                </strong>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {currentStep !== 'design' ? (
        <div className="wizard-nav">
          {currentStepIndex > 0 ? (
            <Button type="button" variant="ghost" onClick={goPrev} disabled={isLoading}>
              Anterior
            </Button>
          ) : null}
          <div className="wizard-nav__spacer" />
          {currentStep === 'confirm' ? (
            <Button type="button" onClick={handleSubmit} loading={isLoading} disabled={!canProceed()}>
              {isLoading ? 'Creando...' : 'Crear evento'}
            </Button>
          ) : (
            <Button type="button" onClick={goNext} disabled={!canProceed()}>
              Siguiente
            </Button>
          )}
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
        </div>
      ) : null}
    </div>
  )
}
