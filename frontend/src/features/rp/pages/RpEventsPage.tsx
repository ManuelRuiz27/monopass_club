import { useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { gsap } from 'gsap'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Modal } from '@/components/Modal'
import { useRpAssignments } from '../hooks'
import { rpApi, type GuestType } from '../api'
import { RpStateView } from '../components/RpStateView'
import { RpSectionHeader } from '../components/RpSectionHeader'
import { useToast } from '@/components/ToastProvider'
import { Button, Input, PageLoadingState } from '@/components/ui'
import { useGsapInteractiveScale } from '@/lib/motion/useGsapInteractiveScale'
import { usePrefersReducedMotion } from '@/lib/motion/usePrefersReducedMotion'

function formatDateTime(dateValue: string) {
  return new Date(dateValue).toLocaleString([], {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatRatio(used: number, limit: number | null) {
  if (!limit || limit <= 0) return null
  const percent = Math.min(100, Math.round((used / limit) * 100))
  return percent
}

export function RpEventsPage() {
  const toast = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const assignmentFromQuery = searchParams.get('assignmentId')
  const { data, isLoading, error, refetch } = useRpAssignments()
  const queryClient = useQueryClient()
  const screenRef = useRef<HTMLDivElement | null>(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(searchParams.get('assignmentId'))
  const [guestType, setGuestType] = useState<GuestType>('GENERAL')
  const [note, setNote] = useState('')

  const activeEvents = useMemo(() => {
    if (!data) return []
    return data.events
      .filter((event) => event.eventActive)
      .sort((a, b) => {
        const startsDiff = new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
        if (startsDiff !== 0) return startsDiff
        return a.eventName.localeCompare(b.eventName, 'es', { sensitivity: 'base' })
      })
  }, [data])

  const totals = useMemo(() => {
    const generated = activeEvents.reduce((total, event) => total + event.usedAccesses, 0)
    const hasUnlimited = activeEvents.some((event) => event.remainingAccesses === null)
    const available = hasUnlimited ? 'Ilimitado' : String(activeEvents.reduce((total, event) => total + (event.remainingAccesses ?? 0), 0))
    return { generated, available }
  }, [activeEvents])

  const selectedEvent = useMemo(
    () => activeEvents.find((event) => event.assignmentId === selectedAssignmentId) ?? null,
    [activeEvents, selectedAssignmentId],
  )
  const selectedLimitReached = selectedEvent?.remainingAccesses === 0

  const mutation = useMutation({
    mutationFn: async (input: {
      eventId: string
      guestType: GuestType
      note?: string
      assignmentId: string
      eventName: string
      eventStartsAt: string
    }) => {
      const ticket = await rpApi.createTicket({
        eventId: input.eventId,
        guestType: input.guestType,
        note: input.note,
      })
      return { ticket, input }
    },
    onSuccess: ({ ticket, input }) => {
      const shareCopy = `Acceso ${ticket.guestType} generado para ${ticket.event.name} (${new Date(ticket.event.startsAt).toLocaleDateString()}).`
      toast.showToast({ title: 'Acceso generado', variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['rp-events'] })
      navigate('/rp/generated', {
        state: {
          ticketId: ticket.id,
          guestType: ticket.guestType,
          eventName: input.eventName,
          eventStartsAt: input.eventStartsAt,
          assignmentId: input.assignmentId,
          shareCopy,
        },
      })
    },
    onError: (mutationError: unknown) => {
      toast.showToast({
        title: 'No se pudo generar el acceso',
        description: mutationError instanceof Error ? mutationError.message : undefined,
        variant: 'error',
      })
    },
  })

  useEffect(() => {
    if (activeEvents.length === 0) {
      setSelectedAssignmentId(null)
      return
    }

    setSelectedAssignmentId((current) => {
      if (current && activeEvents.some((event) => event.assignmentId === current)) return current
      if (assignmentFromQuery && activeEvents.some((event) => event.assignmentId === assignmentFromQuery)) return assignmentFromQuery
      return null
    })
  }, [activeEvents, assignmentFromQuery])

  useEffect(() => {
    if (!selectedEvent) return
    setGuestType('GENERAL')
    setNote('')
    if (mutation.isError) mutation.reset()
  }, [selectedEvent?.assignmentId])

  useGsapInteractiveScale(screenRef, '.rp-event-row', activeEvents.length, { hoverScale: 1.01, pressScale: 0.99 })

  const handleCardKeyDown = (event: KeyboardEvent<HTMLElement>, assignmentId: string) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    setSelectedAssignmentId(assignmentId)
  }

  const handleQuickGenerate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedEvent || selectedLimitReached) return
    if (mutation.isError) mutation.reset()

    mutation.mutate({
      eventId: selectedEvent.eventId,
      guestType,
      note: note.trim() || undefined,
      assignmentId: selectedEvent.assignmentId,
      eventName: selectedEvent.eventName,
      eventStartsAt: selectedEvent.startsAt,
    })
  }

  useLayoutEffect(() => {
    if (prefersReducedMotion) return

    const scope = screenRef.current
    if (!scope) return

    const blocks = gsap.utils.toArray<HTMLElement>('.rp-screen__header, .rp-sales-proof', scope)
    const cards = gsap.utils.toArray<HTMLElement>('.rp-event-row', scope)

    const timeline = gsap.timeline({ defaults: { ease: 'power2.out' } })

    if (blocks.length > 0) {
      timeline.fromTo(
        blocks,
        { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, duration: 0.22, stagger: 0.05, clearProps: 'opacity,transform' },
      )
    }

    if (cards.length > 0) {
      timeline.fromTo(
        cards,
        { autoAlpha: 0, y: 20 },
        { autoAlpha: 1, y: 0, duration: 0.26, stagger: 0.06, clearProps: 'opacity,transform' },
        '-=0.08',
      )
    }

    return () => {
      timeline.kill()
    }
  }, [activeEvents.length, prefersReducedMotion])

  if (isLoading) {
    return <PageLoadingState message="Cargando eventos..." />
  }

  if (error || !data) {
    return (
      <div className="rp-screen">
        <RpSectionHeader
          className="rp-screen__header"
          eyebrow="RP app"
          title="Accesos en vivo"
          description="Activa tickets digitales y comparte en segundos sin frenar ventas."
        />

        <RpStateView
          icon="wifi_off"
          tone="error"
          title="Error al cargar eventos"
          description="No se pudieron cargar tus eventos asignados. Intenta de nuevo."
          actions={
            <Button type="button" variant="secondary" onClick={() => void refetch()}>
              Reintentar
            </Button>
          }
        />
      </div>
    )
  }

  if (activeEvents.length === 0) {
    return (
      <div className="rp-screen">
        <RpSectionHeader
          className="rp-screen__header"
          eyebrow="RP app"
          title="Accesos en vivo"
          description="Activa tickets digitales y comparte en segundos sin frenar ventas."
        />

        <RpStateView
          icon="event_busy"
          title="No tienes eventos asignados"
          description="Contacta a tu manager para que te asigne a un evento activo."
        />
      </div>
    )
  }

  return (
    <div ref={screenRef} className="rp-screen">
      <RpSectionHeader
        className="rp-screen__header"
        eyebrow="RP app"
        title="Accesos en vivo"
        description="Menos impresiones, mas flujo en puerta. Todo se comparte por link y queda trazable."
      />

      <section className="rp-sales-proof" aria-label="Resumen comercial RP">
        <article>
          <span>Accesos generados</span>
          <strong>{totals.generated}</strong>
        </article>
        <article>
          <span>Disponibles</span>
          <strong>{totals.available}</strong>
        </article>
      </section>

      <div className="rp-event-list" role="list">
        {activeEvents.map((event) => (
          <article
            key={event.assignmentId}
            className={`rp-event-row ${selectedEvent?.assignmentId === event.assignmentId ? 'rp-event-row--selected' : ''}`}
            onClick={() => setSelectedAssignmentId(event.assignmentId)}
            onKeyDown={(keyboardEvent) => handleCardKeyDown(keyboardEvent, event.assignmentId)}
            role="button"
            tabIndex={0}
            aria-pressed={selectedEvent?.assignmentId === event.assignmentId}
            aria-label={`Abrir panel rapido para ${event.eventName}`}
          >
            <div className="rp-event-row__main">
              <h4 className="rp-event-row__title">{event.eventName}</h4>
              <p className="text-muted rp-event-row__meta">
                {event.clubName} | {formatDateTime(event.startsAt)}
              </p>
              <p className="text-muted rp-event-row__mix">
                G: {event.guestTypeCounts.GENERAL} | VIP: {event.guestTypeCounts.VIP} | {data.otherLabel}: {event.guestTypeCounts.OTHER}
              </p>
            </div>

            <div className="rp-event-row__stats" aria-label="Resumen de accesos">
              <div className="rp-event-row__stat">
                <span>Generados</span>
                <strong>{event.usedAccesses}</strong>
              </div>
              <div className="rp-event-row__stat">
                <span>Restantes</span>
                <strong>{event.remainingAccesses ?? 'Sin limite'}</strong>
              </div>
              <div className="rp-event-row__stat">
                <span>Limite</span>
                <strong>{event.limitAccesses ?? 'Sin limite'}</strong>
              </div>
            </div>

            {event.limitAccesses ? (
              <div className="rp-event-row__meter" role="presentation">
                <span className="rp-event-row__meter-fill" style={{ width: `${formatRatio(event.usedAccesses, event.limitAccesses) ?? 0}%` }} />
              </div>
            ) : null}

            <div className="rp-event-row__action">
              <span className="badge badge--info">{selectedEvent?.assignmentId === event.assignmentId ? 'Panel abierto' : 'Abrir panel'}</span>
            </div>
          </article>
        ))}
      </div>

      <Modal isOpen={Boolean(selectedEvent)} onClose={() => setSelectedAssignmentId(null)} title="Generar acceso rapido" size="lg">
        {selectedEvent ? (
          <article className="rp-event-quick-panel rp-event-quick-panel--modal" aria-live="polite">
            <header className="rp-event-quick-panel__header">
              <div>
                <p className="rp-event-quick-panel__kicker">EVENTO ABIERTO</p>
                <h4 className="rp-event-quick-panel__title">{selectedEvent.eventName}</h4>
                <p className="text-muted rp-event-quick-panel__meta">
                  {selectedEvent.clubName} | {formatDateTime(selectedEvent.startsAt)}
                </p>
              </div>
              <span className="badge badge--success">Activo</span>
            </header>

            <div className="rp-event-quick-panel__grid">
              <article>
                <span>General</span>
                <strong>{selectedEvent.guestTypeCounts.GENERAL}</strong>
              </article>
              <article>
                <span>VIP</span>
                <strong>{selectedEvent.guestTypeCounts.VIP}</strong>
              </article>
              <article>
                <span>{data.otherLabel}</span>
                <strong>{selectedEvent.guestTypeCounts.OTHER}</strong>
              </article>
              <article>
                <span>Restantes</span>
                <strong>{selectedEvent.remainingAccesses ?? 'Sin limite'}</strong>
              </article>
            </div>

            <div className="rp-event-quick-panel__actions">
              <form className="form-grid rp-event-quick-panel__form" onSubmit={handleQuickGenerate}>
                <div>
                  <span className="form-caption rp-generate-form__label">Tipo de invitado</span>
                  <div className="badge-group rp-generate-form__guest-types">
                    <Button type="button" size="sm" variant={guestType === 'GENERAL' ? 'primary' : 'secondary'} onClick={() => setGuestType('GENERAL')}>
                      General
                    </Button>
                    <Button type="button" size="sm" variant={guestType === 'VIP' ? 'primary' : 'secondary'} onClick={() => setGuestType('VIP')}>
                      VIP
                    </Button>
                    <Button type="button" size="sm" variant={guestType === 'OTHER' ? 'primary' : 'secondary'} onClick={() => setGuestType('OTHER')}>
                      {data.otherLabel}
                    </Button>
                  </div>
                </div>

                <Input
                  label="Nota (opcional)"
                  value={note}
                  onChange={(changeEvent) => setNote(changeEvent.target.value)}
                  placeholder="Nombre del invitado, mesa o referencia"
                  maxLength={100}
                />

                <div className="rp-event-quick-panel__form-actions">
                  <Button type="submit" loading={mutation.isPending} disabled={selectedLimitReached} block>
                    {mutation.isPending ? 'Generando...' : 'Generar acceso ahora'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setGuestType('GENERAL')
                      setNote('')
                      if (mutation.isError) mutation.reset()
                    }}
                  >
                    Limpiar
                  </Button>
                </div>

                {mutation.isError ? (
                  <p className="text-warning rp-event-quick-panel__error">
                    {mutation.error instanceof Error ? mutation.error.message : 'Hubo un problema de conexion. Intenta nuevamente.'}
                  </p>
                ) : null}
              </form>
            </div>
            {selectedLimitReached ? <p className="text-muted rp-event-quick-panel__limit">Sin accesos disponibles para este evento.</p> : null}
          </article>
        ) : null}
      </Modal>
    </div>
  )
}
