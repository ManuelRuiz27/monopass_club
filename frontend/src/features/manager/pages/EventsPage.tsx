import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { managerApi, type EventDTO } from '../api'
import { useToast } from '@/components/ToastProvider'
import { Modal } from '@/components/Modal'
import { TemplateEditor, type TemplateConfig } from '@/components/TemplateEditor'
import { EventWizard, type EventFormData } from '../components/EventWizard'
import { BottomSheet, Button, PageErrorState, PageLoadingState } from '@/components/ui'

type StatusFilter = 'ALL' | 'ACTIVE' | 'CLOSED'

type ClubFilter = 'ALL' | string

function formatDate(value: string) {
  return new Date(value).toLocaleDateString([], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function toDayMonthInput(date: Date) {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`
}

function toTimeInput(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function getGeneratedAccesses(event: EventDTO) {
  return event.assignments.reduce((accumulator, assignment) => accumulator + assignment.usedAccesses, 0)
}

export function EventsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const eventsQuery = useQuery({ queryKey: ['events'], queryFn: managerApi.getEvents })

  const [editingTemplateEvent, setEditingTemplateEvent] = useState<EventDTO | null>(null)
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false)
  const [wizardInitialData, setWizardInitialData] = useState<Partial<EventFormData> | undefined>(undefined)
  const [wizardSessionId, setWizardSessionId] = useState(0)

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [clubFilter, setClubFilter] = useState<ClubFilter>('ALL')
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const [pendingStatusFilter, setPendingStatusFilter] = useState<StatusFilter>('ALL')
  const [pendingClubFilter, setPendingClubFilter] = useState<ClubFilter>('ALL')

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
    onError: (error: unknown) => {
      toast.showToast({
        title: 'Error al guardar plantilla',
        description: error instanceof Error ? error.message : undefined,
        variant: 'error',
      })
    },
  })

  const events = useMemo(() => eventsQuery.data ?? [], [eventsQuery.data])

  const availableClubs = useMemo(() => {
    const clubMap = new Map<string, string>()
    events.forEach((event) => {
      clubMap.set(event.club.id, event.club.name)
    })
    return [...clubMap.entries()].map(([id, name]) => ({ id, name }))
  }, [events])

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const passesStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? event.active : !event.active)
      const passesClub = clubFilter === 'ALL' || event.club.id === clubFilter
      return passesStatus && passesClub
    })
  }, [events, statusFilter, clubFilter])

  const showEmptyState = !eventsQuery.isLoading && !eventsQuery.error && events.length === 0
  const showFilteredEmpty = !eventsQuery.isLoading && !eventsQuery.error && events.length > 0 && filteredEvents.length === 0
  const hasEventsData = eventsQuery.isSuccess

  const openCreateEventModal = () => {
    setWizardInitialData(undefined)
    setWizardSessionId((current) => current + 1)
    setIsCreateEventModalOpen(true)
  }

  const closeCreateEventModal = () => {
    setIsCreateEventModalOpen(false)
    setWizardInitialData(undefined)
  }

  const handleDuplicateEvent = (event: EventDTO) => {
    const now = new Date()
    const tomorrowStart = new Date(now)
    tomorrowStart.setDate(now.getDate() + 1)
    tomorrowStart.setHours(22, 0, 0, 0)

    setWizardInitialData({
      clubId: event.club.id,
      name: `${event.name} (Copia)`,
      eventDate: toDayMonthInput(tomorrowStart),
      startTime: toTimeInput(tomorrowStart),
      template: {
        templateImageUrl: event.templateImageUrl ?? '',
        qrPositionX: event.qrPositionX ?? 0.5,
        qrPositionY: event.qrPositionY ?? 0.5,
        qrSize: event.qrSize ?? 0.35,
      },
      rpAssignments: [],
      scannerTokensCount: 0,
    })
    setWizardSessionId((current) => current + 1)
    setIsCreateEventModalOpen(true)
    toast.showToast({ title: 'Datos copiados al wizard', variant: 'info' })
  }

  const handleSaveTemplate = (config: TemplateConfig) => {
    if (!editingTemplateEvent) return
    updateTemplateMutation.mutate({ eventId: editingTemplateEvent.id, config })
  }

  const openFilterSheet = () => {
    setPendingStatusFilter(statusFilter)
    setPendingClubFilter(clubFilter)
    setIsFilterSheetOpen(true)
  }

  const applyFilterSheet = () => {
    setStatusFilter(pendingStatusFilter)
    setClubFilter(pendingClubFilter)
    setIsFilterSheetOpen(false)
  }

  const clearFilters = () => {
    setStatusFilter('ALL')
    setClubFilter('ALL')
    setPendingStatusFilter('ALL')
    setPendingClubFilter('ALL')
  }

  const isFiltered = statusFilter !== 'ALL' || clubFilter !== 'ALL'

  const renderEventActions = (event: EventDTO, stacked = false) => {
    const isStatusMutationPending = updateEventStatus.isPending && updateEventStatus.variables?.eventId === event.id

    return (
      <div className={`manager-events-actions ${stacked ? 'manager-events-actions--stack' : ''}`}>
        <Button type="button" variant="secondary" size="sm" onClick={() => navigate(`/manager/events/${event.id}`)}>
          Ver detalle
        </Button>

        <Button
          type="button"
          variant={event.active ? 'danger' : 'success'}
          size="sm"
          onClick={() => updateEventStatus.mutate({ eventId: event.id, active: !event.active })}
          loading={isStatusMutationPending}
        >
          {event.active ? 'Cerrar' : 'Reabrir'}
        </Button>

        <Button type="button" variant="ghost" size="sm" onClick={() => setEditingTemplateEvent(event)}>
          Plantilla
        </Button>

        <Button type="button" variant="ghost" size="sm" onClick={() => handleDuplicateEvent(event)}>
          Duplicar
        </Button>
      </div>
    )
  }

  return (
    <div className="manager-events-page">
      <header className="manager-events-page__header">
        <div className="manager-events-page__header-left">
          <h3 className="manager-events-page__title">Eventos</h3>
          <p className="text-muted manager-events-page__subtitle">Gestiona los eventos de tu club</p>
        </div>

        <Button
          type="button"
          leftIcon={<span className="material-symbols-outlined" aria-hidden="true">add</span>}
          onClick={openCreateEventModal}
        >
          Nuevo Evento
        </Button>
      </header>

      {eventsQuery.isLoading ? <PageLoadingState message="Cargando eventos..." /> : null}
      {eventsQuery.error ? <PageErrorState description="No se pudieron cargar los eventos." /> : null}

      {hasEventsData && !showEmptyState ? (
        <section className="manager-events-toolbar">
          <div className="manager-events-toolbar__mobile">
            <Button type="button" variant="secondary" size="sm" onClick={openFilterSheet}>
              Filtrar
            </Button>
            {isFiltered ? (
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                Limpiar
              </Button>
            ) : null}
          </div>

          <div className="manager-events-toolbar__desktop">
            <label>
              Estado
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
                <option value="ALL">Todos</option>
                <option value="ACTIVE">Activos</option>
                <option value="CLOSED">Cerrados</option>
              </select>
            </label>

            <label>
              Club
              <select value={clubFilter} onChange={(event) => setClubFilter(event.target.value)}>
                <option value="ALL">Todos</option>
                {availableClubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>
      ) : null}

      {showEmptyState ? (
        <section className="manager-empty-state card">
          <div className="manager-empty-state__icon-shell" aria-hidden="true">
            <span className="material-symbols-outlined">event_busy</span>
          </div>
          <h4 className="manager-empty-state__title">Sin eventos todavia</h4>
          <p className="text-muted manager-empty-state__description">Crea tu primer evento para empezar a gestionar accesos</p>
          <Button
            type="button"
            leftIcon={<span className="material-symbols-outlined" aria-hidden="true">add</span>}
            onClick={openCreateEventModal}
          >
            Crear primer evento
          </Button>
        </section>
      ) : null}

      {showFilteredEmpty ? (
        <section className="manager-empty-state manager-empty-state--compact card">
          <h4 className="manager-empty-state__title">No hay eventos para este filtro</h4>
          <p className="text-muted manager-empty-state__description">Ajusta los filtros o limpia la busqueda para ver todos los eventos.</p>
          <Button type="button" variant="secondary" onClick={clearFilters}>Limpiar filtros</Button>
        </section>
      ) : null}

      {hasEventsData && !showEmptyState && !showFilteredEmpty ? (
        <>
          <div className="manager-events-table-wrap">
            <table className="manager-events-table">
              <thead>
                <tr>
                  <th>Evento</th>
                  <th>Fecha</th>
                  <th>Accesos</th>
                  <th>RPs</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => (
                  <tr key={event.id}>
                    <td>
                      <strong>{event.name}</strong>
                      <p className="text-muted manager-events-table__club">{event.club.name}</p>
                    </td>
                    <td>{formatDate(event.startsAt)}</td>
                    <td>{getGeneratedAccesses(event)}</td>
                    <td>{event.assignments.length}</td>
                    <td>
                      <span className={`badge ${event.active ? 'badge--success' : 'badge--warning'}`}>
                        {event.active ? 'Activo' : 'Cerrado'}
                      </span>
                    </td>
                    <td>{renderEventActions(event)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="manager-events-mobile-list">
            {filteredEvents.map((event) => (
              <article key={`mobile-${event.id}`} className="card manager-events-mobile-card">
                <header className="manager-events-mobile-card__header">
                  <div>
                    <h4 className="manager-events-mobile-card__title">{event.name}</h4>
                    <p className="text-muted manager-events-mobile-card__club">{event.club.name}</p>
                  </div>
                  <span className={`badge ${event.active ? 'badge--success' : 'badge--warning'}`}>
                    {event.active ? 'Activo' : 'Cerrado'}
                  </span>
                </header>

                <div className="manager-events-mobile-card__stats">
                  <div>
                    <span className="text-muted">Fecha</span>
                    <strong>{formatDate(event.startsAt)}</strong>
                  </div>
                  <div>
                    <span className="text-muted">Accesos</span>
                    <strong>{getGeneratedAccesses(event)}</strong>
                  </div>
                  <div>
                    <span className="text-muted">RPs</span>
                    <strong>{event.assignments.length}</strong>
                  </div>
                </div>

                {renderEventActions(event, true)}
              </article>
            ))}
          </div>
        </>
      ) : null}

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

      <Modal isOpen={isCreateEventModalOpen} onClose={closeCreateEventModal} title="Nuevo Evento" size="lg">
        <EventWizard
          key={`wizard-${wizardSessionId}`}
          initialData={wizardInitialData}
          onComplete={closeCreateEventModal}
          onCancel={closeCreateEventModal}
        />
      </Modal>

      <BottomSheet
        open={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        title="Filtrar eventos"
        actions={
          <>
            <Button type="button" variant="secondary" onClick={() => setIsFilterSheetOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={applyFilterSheet}>
              Aplicar
            </Button>
          </>
        }
      >
        <div className="form-grid manager-events-sheet">
          <label>
            Estado
            <select value={pendingStatusFilter} onChange={(event) => setPendingStatusFilter(event.target.value as StatusFilter)}>
              <option value="ALL">Todos</option>
              <option value="ACTIVE">Activos</option>
              <option value="CLOSED">Cerrados</option>
            </select>
          </label>

          <label>
            Club
            <select value={pendingClubFilter} onChange={(event) => setPendingClubFilter(event.target.value)}>
              <option value="ALL">Todos</option>
              {availableClubs.map((club) => (
                <option key={`sheet-${club.id}`} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </BottomSheet>
    </div>
  )
}
