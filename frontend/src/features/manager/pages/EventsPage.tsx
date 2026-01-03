import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { managerApi, type EventDTO } from '../api'
import { useToast } from '@/components/ToastProvider'
import { Modal } from '@/components/Modal'
import { TemplateEditor, type TemplateConfig } from '@/components/TemplateEditor'
import { EventWizard, type EventFormData } from '../components/EventWizard'

export function EventsPage() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const eventsQuery = useQuery({ queryKey: ['events'], queryFn: managerApi.getEvents })
  const rpsQuery = useQuery({ queryKey: ['rps'], queryFn: managerApi.getRps })
  const [assignForms, setAssignForms] = useState<Record<string, { rpId: string; limit: string }>>({})

  // Estado para el modal de edición de plantilla
  const [editingTemplateEvent, setEditingTemplateEvent] = useState<EventDTO | null>(null)

  // Estado para el wizard de creación de evento
  const [showWizard, setShowWizard] = useState(false)
  const [wizardInitialData, setWizardInitialData] = useState<Partial<EventFormData> | undefined>(undefined)

  const handleDuplicateEvent = (event: EventDTO) => {
    // Configurar fechas para "mañana" a la misma hora
    const now = new Date()
    const tomorrowStart = new Date(now)
    tomorrowStart.setDate(now.getDate() + 1)
    tomorrowStart.setHours(22, 0, 0, 0) // Default 10 PM

    const tomorrowEnd = new Date(tomorrowStart)
    tomorrowEnd.setHours(tomorrowStart.getHours() + 6) // +6 horas

    // Copiar datos del evento
    setWizardInitialData({
      clubId: event.club.id,
      name: `${event.name} (Copia)`,
      startsAt: tomorrowStart.toISOString().slice(0, 16),
      endsAt: tomorrowEnd.toISOString().slice(0, 16),
      template: {
        templateImageUrl: event.templateImageUrl ?? '',
        qrPositionX: event.qrPositionX ?? 0.5,
        qrPositionY: event.qrPositionY ?? 0.5,
        qrSize: event.qrSize ?? 0.35,
      },
      // También podríamos copiar asignaciones, pero mejor empezar limpio o dejarlo opcional
      rpAssignments: [],
    })
    setShowWizard(true)
    toast.showToast({ title: 'Datos copiados al wizard', variant: 'info' })
    // Scroll al wizard
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
    }, 100)
  }

  const updateEventStatus = useMutation({
    mutationFn: (payload: { eventId: string; active: boolean }) => managerApi.updateEvent(payload.eventId, { active: payload.active }),
    onSuccess: (_, variables) => {
      toast.showToast({
        title: variables.active ? 'Evento reabierto' : 'Evento cerrado',
        variant: variables.active ? 'success' : 'info',
      })
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })


  const assignMutation = useMutation({
    mutationFn: ({ eventId, rpId, limit }: { eventId: string; rpId: string; limit: number | null }) =>
      managerApi.assignRpToEvent(eventId, { rpId, limitAccesses: limit }),
    onSuccess: (_, variables) => {
      toast.showToast({ title: 'RP asignado', variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      setAssignForms((prev) => ({ ...prev, [variables.eventId]: { rpId: '', limit: '' } }))
    },
  })

  const updateLimitMutation = useMutation({
    mutationFn: ({ eventId, rpId, limit }: { eventId: string; rpId: string; limit: number | null }) =>
      managerApi.updateAssignmentLimit(eventId, rpId, limit),
    onSuccess: () => {
      toast.showToast({ title: 'Limite actualizado', variant: 'info' })
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })

  const removeAssignmentMutation = useMutation({
    mutationFn: ({ eventId, rpId }: { eventId: string; rpId: string }) => managerApi.removeAssignment(eventId, rpId),
    onSuccess: () => {
      toast.showToast({ title: 'Asignacion removida', variant: 'info' })
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })

  // Mutación para guardar la plantilla del evento
  const updateTemplateMutation = useMutation({
    mutationFn: ({ eventId, config }: { eventId: string; config: TemplateConfig }) =>
      managerApi.updateTemplate(eventId, {
        templateImageUrl: config.templateImageUrl || null,
        qrPositionX: config.qrPositionX,
        qrPositionY: config.qrPositionY,
        qrSize: config.qrSize,
      }),
    onSuccess: () => {
      toast.showToast({ title: 'Plantilla guardada', variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      setEditingTemplateEvent(null)
    },
    onError: (err: unknown) => {
      toast.showToast({
        title: 'Error al guardar plantilla',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      })
    },
  })

  const handleSaveTemplate = (config: TemplateConfig) => {
    if (!editingTemplateEvent) return
    updateTemplateMutation.mutate({ eventId: editingTemplateEvent.id, config })
  }

  const hasTemplate = (event: EventDTO) => Boolean(event.templateImageUrl)

  const handleAssignSubmit = (eventId: string) => {
    const current = assignForms[eventId]
    if (!current?.rpId) return
    const limit = current.limit ? Number(current.limit) : null
    assignMutation.mutate({ eventId, rpId: current.rpId, limit })
  }

  const handleLimitUpdate = (event: EventDTO, rpId: string) => {
    const current = event.assignments.find((assignment) => assignment.rpId === rpId)
    const suggested = current?.limitAccesses ?? ''
    const raw = window.prompt('Nuevo limite (deja vacio para sin limite)', suggested ? String(suggested) : '')
    if (raw === null) return
    const nextValue = raw.trim() === '' ? null : Number(raw)
    if (nextValue !== null && Number.isNaN(nextValue)) {
      toast.showToast({ title: 'Valor invalido', description: 'Ingresa un numero valido.', variant: 'error' })
      return
    }
    updateLimitMutation.mutate({ eventId: event.id, rpId, limit: nextValue })
  }

  const handleRemoveAssignment = (eventId: string, rpId: string) => {
    if (!window.confirm('Eliminar esta asignacion?')) return
    removeAssignmentMutation.mutate({ eventId, rpId })
  }

  const availableRps = rpsQuery.data ?? []

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Eventos</h3>
      {eventsQuery.isLoading ? <p>Cargando eventos...</p> : null}
      {eventsQuery.error ? <p className="text-danger">No se pudieron cargar los eventos.</p> : null}

      <div className="card-grid" style={{ marginTop: '1rem' }}>
        {eventsQuery.data?.map((event) => (
          <article key={event.id} className="card">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: 0 }}>{event.name}</h4>
                <p style={{ margin: 0 }} className="text-muted">
                  {event.club.name}
                </p>
                <small>{new Date(event.startsAt).toLocaleString()} - {new Date(event.endsAt).toLocaleString()}</small>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  type="button"
                  className="button--ghost"
                  onClick={() => handleDuplicateEvent(event)}
                  title="Duplicar evento"
                  style={{ padding: '0.25rem 0.5rem', fontSize: '1rem' }}
                >
                  📄
                </button>
                <span className={`badge ${event.active ? 'badge--success' : 'badge--danger'}`}>
                  {event.active ? 'Activo' : 'Cerrado'}
                </span>
              </div>
            </header>
            <div style={{ margin: '0.75rem 0', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => updateEventStatus.mutate({ eventId: event.id, active: !event.active })}>
                {event.active ? 'Cerrar evento' : 'Reabrir'}
              </button>
              <button type="button" className="button--ghost" onClick={() => setEditingTemplateEvent(event)}>
                {hasTemplate(event) ? '📷 Editar plantilla' : '📷 Configurar plantilla'}
              </button>
            </div>
            {/* Indicador de estado de plantilla */}
            <div className={`event-card__template-status ${hasTemplate(event) ? 'event-card__template-status--configured' : 'event-card__template-status--pending'}`}>
              {hasTemplate(event) ? (
                <>✓ Plantilla configurada</>
              ) : (
                <>⚠ Sin plantilla - Los tickets no tendrán imagen de fondo</>
              )}
            </div>
            <section>
              <h5 style={{ margin: '0.5rem 0' }}>RPs asignados</h5>
              {event.assignments.length === 0 ? <p className="text-muted">Aun no hay asignaciones.</p> : null}
              {event.assignments.map((assignment) => (
                <div key={assignment.id} className="panel">
                  <strong>{assignment.rp.user.name}</strong>
                  <p style={{ margin: '0.25rem 0' }} className="text-muted">
                    Generados: {assignment.usedAccesses}
                  </p>
                  <p style={{ margin: '0.25rem 0' }} className="text-muted">
                    Limite: {assignment.limitAccesses ?? 'Sin limite'}
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => handleLimitUpdate(event, assignment.rpId)}>
                      Editar limite
                    </button>
                    <button type="button" onClick={() => handleRemoveAssignment(event.id, assignment.rpId)}>
                      Quitar RP
                    </button>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: '0.75rem' }}>
                <h6 style={{ margin: '0.25rem 0' }}>Asignar RP</h6>
                <div className="form-grid">
                  <select
                    value={assignForms[event.id]?.rpId ?? ''}
                    onChange={(e) =>
                      setAssignForms((prev) => ({ ...prev, [event.id]: { rpId: e.target.value, limit: prev[event.id]?.limit ?? '' } }))
                    }
                    disabled={!event.active}
                  >
                    <option value="">Selecciona RP</option>
                    {availableRps.map((rp) => (
                      <option key={rp.id} value={rp.id} disabled={!rp.active}>
                        {rp.user.name} {!rp.active ? '(Inactivo)' : ''}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    placeholder="Limite opcional"
                    value={assignForms[event.id]?.limit ?? ''}
                    onChange={(e) =>
                      setAssignForms((prev) => ({ ...prev, [event.id]: { rpId: prev[event.id]?.rpId ?? '', limit: e.target.value } }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => handleAssignSubmit(event.id)}
                    disabled={!event.active || assignMutation.isPending}
                  >
                    {assignMutation.isPending ? 'Asignando...' : 'Asignar'}
                  </button>
                </div>
              </div>
            </section>
          </article>
        ))}
      </div>

      {/* Modal de edición de plantilla */}
      <Modal
        isOpen={editingTemplateEvent !== null}
        onClose={() => setEditingTemplateEvent(null)}
        title={`Plantilla - ${editingTemplateEvent?.name ?? ''}`}
        size="lg"
      >
        {editingTemplateEvent && (
          <TemplateEditor
            eventName={editingTemplateEvent.name}
            initialConfig={{
              templateImageUrl: editingTemplateEvent.templateImageUrl ?? '',
              qrPositionX: editingTemplateEvent.qrPositionX ?? 0.5,
              qrPositionY: editingTemplateEvent.qrPositionY ?? 0.5,
              qrSize: editingTemplateEvent.qrSize ?? 0.35,
            }}
            onSave={handleSaveTemplate}
            onCancel={() => setEditingTemplateEvent(null)}
            isSaving={updateTemplateMutation.isPending}
          />
        )}
      </Modal>

      {/* Wizard de creación de evento inline */}
      <section className="card" style={{ marginTop: '2rem' }}>
        <h4 style={{ marginTop: 0, marginBottom: '1rem' }}>✨ Crear nuevo evento</h4>
        {showWizard ? (
          <EventWizard
            key={wizardInitialData ? 'duplicate' : 'new'} // Force remount if type changes
            initialData={wizardInitialData}
            onComplete={() => {
              setShowWizard(false)
              setWizardInitialData(undefined)
            }}
            onCancel={() => {
              setShowWizard(false)
              setWizardInitialData(undefined)
            }}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <p className="text-muted" style={{ margin: 0 }}>Crea un evento con plantilla y asignación de RPs en un flujo guiado.</p>
            <button
              type="button"
              onClick={() => {
                setWizardInitialData(undefined)
                setShowWizard(true)
              }}
              style={{ marginTop: '1rem' }}
            >
              🚀 Iniciar wizard
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
