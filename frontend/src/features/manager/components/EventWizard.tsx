import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { managerApi, type ClubDTO, type RpDTO } from '../api'
import { useToast } from '@/components/ToastProvider'
import { TemplateEditor, type TemplateConfig } from '@/components/TemplateEditor'
import { Button } from '@/components/ui'
import { buildWelcomeMessage, createUserWithAutoCredentials } from '../utils/userCredentials'

type WizardStep = 'basics' | 'design' | 'rps' | 'confirm'

export type EventFormData = {
  clubId: string
  name: string
  eventDate: string
  startTime: string
  template: TemplateConfig
  rpAssignments: Array<{ rpId: string; limit: string }>
  scannerTokensCount: number
}

type EventWindow = {
  startsAt: Date
  endsAt: Date
  durationLabel: string
}

const DEFAULT_START_TIME = '18:00'
const DEFAULT_EVENT_NAME = 'Evento especial'
const DEFAULT_SCANNER_TOKENS = 0
const EVENT_DURATION_HOURS = 12

const dayMonthPattern = /^(\d{1,2})\/(\d{1,2})$/
const timePattern = /^([01]?\d|2[0-3]):([0-5]\d)$/

const toDayMonth = (date: Date) =>
  `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`

const toTimeValue = (date: Date) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`

const normalizeDayMonth = (value: string) => {
  const normalized = value.trim().replace(/-/g, '/')
  const match = normalized.match(dayMonthPattern)
  if (!match) return normalized
  return `${match[1].padStart(2, '0')}/${match[2].padStart(2, '0')}`
}

const buildEventWindow = (eventDate: string, startTime: string, year: number): EventWindow | null => {
  const dayMonth = normalizeDayMonth(eventDate)
  const dayMonthMatch = dayMonth.match(dayMonthPattern)
  const timeMatch = startTime.trim().match(timePattern)
  if (!dayMonthMatch || !timeMatch) return null

  const day = Number(dayMonthMatch[1])
  const month = Number(dayMonthMatch[2])
  const hours = Number(timeMatch[1])
  const minutes = Number(timeMatch[2])

  const startsAt = new Date(year, month - 1, day, hours, minutes, 0, 0)
  if (
    Number.isNaN(startsAt.getTime()) ||
    startsAt.getFullYear() !== year ||
    startsAt.getMonth() !== month - 1 ||
    startsAt.getDate() !== day
  ) {
    return null
  }

  const endsAt = new Date(startsAt)
  if (startsAt.getMonth() === 11) {
    endsAt.setMonth(endsAt.getMonth() + 1)
    return { startsAt, endsAt, durationLabel: '1 mes (evento en diciembre)' }
  }

  endsAt.setHours(endsAt.getHours() + EVENT_DURATION_HOURS)
  return { startsAt, endsAt, durationLabel: '12 horas (automatico)' }
}

const defaultFormData = (): EventFormData => ({
  clubId: '',
  name: DEFAULT_EVENT_NAME,
  eventDate: toDayMonth(new Date()),
  startTime: DEFAULT_START_TIME,
  template: {
    templateImageUrl: '',
    qrPositionX: 0.5,
    qrPositionY: 0.5,
    qrSize: 0.35,
  },
  rpAssignments: [],
  scannerTokensCount: DEFAULT_SCANNER_TOKENS,
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
  initialData?: Partial<EventFormData> & { startsAt?: string }
}

function resolveInitialData(initialData?: Partial<EventFormData> & { startsAt?: string }): Partial<EventFormData> {
  if (!initialData) return {}

  const fromStartsAt = initialData.startsAt ? new Date(initialData.startsAt) : null
  const derivedDate = fromStartsAt && !Number.isNaN(fromStartsAt.getTime()) ? toDayMonth(fromStartsAt) : undefined
  const derivedTime = fromStartsAt && !Number.isNaN(fromStartsAt.getTime()) ? toTimeValue(fromStartsAt) : undefined

  return {
    ...initialData,
    eventDate: initialData.eventDate ?? derivedDate,
    startTime: initialData.startTime ?? derivedTime,
  }
}

export function EventWizard({ onComplete, onCancel, initialData }: EventWizardProps) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const currentYear = new Date().getFullYear()
  const [currentStep, setCurrentStep] = useState<WizardStep>('basics')
  const [formData, setFormData] = useState<EventFormData>({
    ...defaultFormData(),
    ...resolveInitialData(initialData),
  })

  const clubsQuery = useQuery({ queryKey: ['clubs'], queryFn: managerApi.getClubs })
  const rpsQuery = useQuery({ queryKey: ['rps'], queryFn: managerApi.getRps })
  const groupsQuery = useQuery({ queryKey: ['rp-groups'], queryFn: managerApi.getRpGroups })
  const scannersQuery = useQuery({ queryKey: ['scanners'], queryFn: managerApi.getScanners })

  const activeRps = useMemo(() => (rpsQuery.data ?? []).filter((rp: RpDTO) => rp.active), [rpsQuery.data])
  const eventWindow = useMemo(
    () => buildEventWindow(formData.eventDate, formData.startTime, currentYear),
    [formData.eventDate, formData.startTime, currentYear],
  )
  const takenScannerUsernames = useMemo(() => {
    const taken = new Set<string>()
    ;(scannersQuery.data ?? []).forEach((scanner) => taken.add(scanner.user.username.toLowerCase()))
    return taken
  }, [scannersQuery.data])

  const loadGroup = (groupId: string) => {
    const group = groupsQuery.data?.find((item) => item.id === groupId)
    if (!group) return

    setFormData((previous) => {
      const currentIds = new Set(previous.rpAssignments.map((assignment) => assignment.rpId))
      const nextAssignments = [...previous.rpAssignments]
      let addedCount = 0

      group.members.forEach((member) => {
        const rpIsActive = activeRps.some((rp) => rp.id === member.id)
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
    queryClient.invalidateQueries({ queryKey: ['scanners'] })
    onComplete()
  }

  const createScannerTokensMutation = useMutation({
    mutationFn: async ({ count, eventName }: { count: number; eventName: string }) => {
      const loginUrl = `${window.location.origin}/login`
      const takenForRun = new Set(takenScannerUsernames)
      const invites: Array<{ name: string; username: string; password: string; message: string }> = []

      for (let index = 0; index < count; index += 1) {
        const scannerName = `Scanner ${index + 1} - ${eventName}`
        const { username, password } = await createUserWithAutoCredentials({
          displayName: scannerName,
          takenUsernames: takenForRun,
          createUser: ({ username: generatedUsername, password: generatedPassword }) =>
            managerApi.createScanner({
              name: scannerName,
              username: generatedUsername,
              password: generatedPassword,
            }),
        })
        takenForRun.add(username.toLowerCase())
        invites.push({
          name: scannerName,
          username,
          password,
          message: buildWelcomeMessage({
            profileName: scannerName,
            username,
            password,
            loginUrl,
            role: 'scanner',
          }),
        })
      }

      return invites
    },
    onSuccess: (invites) => {
      if (invites.length > 0) {
        const fullMessage = invites.map((item) => item.message).join('\n\n')
        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
          void navigator.clipboard.writeText(fullMessage)
        }
        toast.showToast({
          title: `${invites.length} acceso(s) scanner creados`,
          description: 'Mensajes listos para compartir (copiados al portapapeles).',
          variant: 'success',
          durationMs: 9000,
        })
      }
      finishWizard()
    },
    onError: (error: unknown) => {
      toast.showToast({
        title: 'Evento creado, pero no se pudieron generar todos los tokens scanner',
        description: error instanceof Error ? error.message : undefined,
        variant: 'warning',
      })
      finishWizard()
    },
  })

  const finalizeAfterEvent = () => {
    const scannerCount = Number.isFinite(formData.scannerTokensCount) ? Math.max(0, Math.floor(formData.scannerTokensCount)) : 0
    if (scannerCount === 0) {
      finishWizard()
      return
    }

    createScannerTokensMutation.mutate({
      count: scannerCount,
      eventName: formData.name.trim() || DEFAULT_EVENT_NAME,
    })
  }

  const assignRpsMutation = useMutation({
    mutationFn: async ({ eventId }: { eventId: string }) => {
      for (const assignment of formData.rpAssignments) {
        const limit = assignment.limit ? Number(assignment.limit) : null
        await managerApi.assignRpToEvent(eventId, { rpId: assignment.rpId, limitAccesses: limit })
      }
    },
    onSuccess: () => {
      finalizeAfterEvent()
    },
    onError: () => {
      toast.showToast({ title: 'Evento creado pero hubo un error al asignar RPs', variant: 'info' })
      finalizeAfterEvent()
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
        finalizeAfterEvent()
      }
    },
    onError: () => {
      toast.showToast({ title: 'Evento creado pero hubo un error con la plantilla', variant: 'info' })
      finalizeAfterEvent()
    },
  })

  const createEventMutation = useMutation({
    mutationFn: () => {
      const resolvedWindow = buildEventWindow(formData.eventDate, formData.startTime, currentYear)
      if (!resolvedWindow) {
        throw new Error(`Fecha u hora invalida. Usa formato dd/mm para ${currentYear}.`)
      }

      return managerApi.createEvent({
        clubId: formData.clubId,
        name: formData.name.trim(),
        startsAt: resolvedWindow.startsAt.toISOString(),
        endsAt: resolvedWindow.endsAt.toISOString(),
      })
    },
    onSuccess: (event) => {
      if (formData.template.templateImageUrl) {
        updateTemplateMutation.mutate({ eventId: event.id })
      } else if (formData.rpAssignments.length > 0) {
        assignRpsMutation.mutate({ eventId: event.id })
      } else {
        finalizeAfterEvent()
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

  const isLoading =
    createEventMutation.isPending ||
    updateTemplateMutation.isPending ||
    assignRpsMutation.isPending ||
    createScannerTokensMutation.isPending
  const currentStepIndex = steps.findIndex((step) => step.key === currentStep)

  const canProceed = () => {
    switch (currentStep) {
      case 'basics':
        return Boolean(formData.clubId && formData.name.trim() && eventWindow)
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

  const selectAllRps = () => {
    setFormData((previous) => {
      const limits = new Map(previous.rpAssignments.map((assignment) => [assignment.rpId, assignment.limit]))
      return {
        ...previous,
        rpAssignments: activeRps.map((rp) => ({
          rpId: rp.id,
          limit: limits.get(rp.id) ?? '',
        })),
      }
    })
  }

  const clearAllRps = () => {
    setFormData((previous) => ({ ...previous, rpAssignments: [] }))
  }

  const allActiveRpsSelected =
    activeRps.length > 0 && activeRps.every((rp) => formData.rpAssignments.some((assignment) => assignment.rpId === rp.id))

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
                Fecha (dd/mm)
                <input
                  value={formData.eventDate}
                  onChange={(event) => setFormData((previous) => ({ ...previous, eventDate: event.target.value }))}
                  onBlur={(event) =>
                    setFormData((previous) => ({
                      ...previous,
                      eventDate: normalizeDayMonth(event.target.value),
                    }))
                  }
                  placeholder="19/02"
                  inputMode="numeric"
                  required
                />
              </label>
              <label>
                Hora de inicio
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(event) => setFormData((previous) => ({ ...previous, startTime: event.target.value }))}
                  step={300}
                  required
                />
              </label>
            </div>
          </div>
        ) : null}

        {currentStep === 'design' ? (
          <div>
            <div className="event-wizard-design__actions">
              <Button type="button" variant="ghost" size="sm" onClick={goNext}>
                Saltar por ahora
              </Button>
            </div>
            <TemplateEditor
              initialConfig={formData.template}
              onConfigChange={(config) => {
                setFormData((previous) => ({ ...previous, template: config }))
              }}
              onSave={() => undefined}
              onCancel={() => undefined}
              hideActions
              compactMode
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
            <div className="event-wizard-rps__bulk-actions">
              <Button type="button" variant="secondary" size="sm" onClick={selectAllRps} disabled={activeRps.length === 0 || allActiveRpsSelected}>
                Seleccionar todos
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearAllRps}
                disabled={formData.rpAssignments.length === 0}
              >
                Limpiar seleccion
              </Button>
            </div>
            <p className="text-muted event-wizard-step__subtitle">
              Selecciona los RPs que podran generar accesos para este evento.
            </p>
            {activeRps.length === 0 ? (
              <p className="text-warning">No hay RPs activos. Puedes crear el evento y asignarlos despues.</p>
            ) : (
              <div className="rp-selection-grid">
                {activeRps.map((rp: RpDTO) => {
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

            <div className="event-wizard-rps__scanner-tokens">
              <h4>Tokens scanner</h4>
              <p className="text-muted">Genera accesos para staff por token (login rapido).</p>
              <label>
                Cantidad de tokens
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={formData.scannerTokensCount}
                  onChange={(event) =>
                    setFormData((previous) => ({
                      ...previous,
                      scannerTokensCount: Math.min(50, Math.max(0, Number(event.target.value) || 0)),
                    }))
                  }
                />
              </label>
            </div>
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
                <strong>{eventWindow ? eventWindow.startsAt.toLocaleString() : '-'}</strong>
              </div>
              <div className="confirm-item">
                <span className="text-muted">Fin automatico:</span>
                <strong>{eventWindow ? eventWindow.endsAt.toLocaleString() : '-'}</strong>
              </div>
              <div className="confirm-item">
                <span className="text-muted">Duracion:</span>
                <strong>{eventWindow?.durationLabel ?? '-'}</strong>
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
              <div className="confirm-item">
                <span className="text-muted">Tokens scanner:</span>
                <strong>{formData.scannerTokensCount > 0 ? `${formData.scannerTokensCount} por crear` : 'Sin generar'}</strong>
              </div>
            </div>
          </div>
        ) : null}
      </div>

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
    </div>
  )
}
