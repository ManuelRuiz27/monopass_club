import { useLayoutEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { gsap } from 'gsap'
import { useNavigate, useParams } from 'react-router-dom'
import { useRpAssignments } from '../hooks'
import { rpApi, type GuestType } from '../api'
import { RpStateView } from '../components/RpStateView'
import { useToast } from '@/components/ToastProvider'
import { Button, Input, PageLoadingState } from '@/components/ui'
import { usePrefersReducedMotion } from '@/lib/motion/usePrefersReducedMotion'

function formatDateTime(dateValue: string) {
  return new Date(dateValue).toLocaleString([], {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const generationErrorCopy = 'Hubo un problema de conexion. Por favor intenta nuevamente.'

export function RpGeneratePage() {
  const toast = useToast()
  const { assignmentId = '' } = useParams()
  const { data, isLoading, error, refetch } = useRpAssignments()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const screenRef = useRef<HTMLDivElement | null>(null)
  const prefersReducedMotion = usePrefersReducedMotion()

  const [guestType, setGuestType] = useState<GuestType>('GENERAL')
  const [note, setNote] = useState('')

  const eventData = useMemo(() => {
    if (!data) return null
    return data.events.find((event) => event.assignmentId === assignmentId) ?? null
  }, [assignmentId, data])

  const mutation = useMutation({
    mutationFn: rpApi.createTicket,
    onSuccess: (ticket) => {
      const shareCopy = `Acceso ${ticket.guestType} generado para ${ticket.event.name} (${new Date(ticket.event.startsAt).toLocaleDateString()}).`
      toast.showToast({ title: 'Acceso generado', variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['rp-events'] })

      navigate('/rp/generated', {
        state: {
          ticketId: ticket.id,
          guestType: ticket.guestType,
          eventName: ticket.event.name,
          eventStartsAt: ticket.event.startsAt,
          assignmentId,
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

  useLayoutEffect(() => {
    if (prefersReducedMotion) return

    const scope = screenRef.current
    if (!scope) return

    const blocks = gsap.utils.toArray<HTMLElement>(
      '.rp-screen__back, .rp-generate-summary, .rp-generate-form, .rp-state, .rp-generate-error',
      scope,
    )

    if (blocks.length === 0) return

    const tween = gsap.fromTo(
      blocks,
      { autoAlpha: 0, y: 18 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.26,
        stagger: 0.06,
        ease: 'power2.out',
        clearProps: 'opacity,transform',
      },
    )

    return () => {
      tween.kill()
    }
  }, [assignmentId, error, isLoading, mutation.status, prefersReducedMotion])

  if (isLoading) {
    return <PageLoadingState message="Cargando evento..." />
  }

  if (error || !data) {
    return (
      <div ref={screenRef} className="rp-screen">
        <Button type="button" variant="ghost" size="sm" className="rp-screen__back" onClick={() => navigate('/rp/events')}>
          Volver a eventos
        </Button>

        <RpStateView
          icon="wifi_off"
          tone="error"
          title="Error al cargar evento"
          description="No pudimos cargar la informacion del evento. Intenta de nuevo."
          actions={
            <Button type="button" variant="secondary" onClick={() => void refetch()}>
              Reintentar
            </Button>
          }
        />
      </div>
    )
  }

  if (!eventData) {
    return (
      <div ref={screenRef} className="rp-screen">
        <Button type="button" variant="ghost" size="sm" className="rp-screen__back" onClick={() => navigate('/rp/events')}>
          Volver a eventos
        </Button>

        <RpStateView
          icon="event_busy"
          tone="warning"
          title="Evento no encontrado"
          description="Selecciona un evento asignado para continuar."
          actions={
            <Button type="button" variant="secondary" onClick={() => navigate('/rp/events')}>
              Volver a mis eventos
            </Button>
          }
        />
      </div>
    )
  }

  if (!eventData.eventActive) {
    return (
      <div ref={screenRef} className="rp-screen">
        <Button type="button" variant="ghost" size="sm" className="rp-screen__back" onClick={() => navigate('/rp/events')}>
          Volver a eventos
        </Button>

        <RpStateView
          icon="event_busy"
          tone="warning"
          title="Evento cerrado"
          description="Este evento ya no esta activo para generar accesos."
          actions={
            <Button type="button" variant="secondary" onClick={() => navigate('/rp/events')}>
              Volver a mis eventos
            </Button>
          }
        />
      </div>
    )
  }

  const limitReached = eventData.remainingAccesses === 0
  const guestOptions: Array<{ value: GuestType; label: string }> = [
    { value: 'GENERAL', label: 'General' },
    { value: 'VIP', label: 'VIP' },
    { value: 'OTHER', label: data.otherLabel },
  ]

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (mutation.isError) mutation.reset()

    mutation.mutate({
      eventId: eventData.eventId,
      guestType,
      note: note.trim() || undefined,
    })
  }

  const detailedErrorMessage = mutation.error instanceof Error ? mutation.error.message.trim() : ''
  const shouldRenderDetailedError = detailedErrorMessage.length > 0 && detailedErrorMessage !== generationErrorCopy

  return (
    <div ref={screenRef} className="rp-screen">
      <Button type="button" variant="ghost" size="sm" className="rp-screen__back" onClick={() => navigate('/rp/events')}>
        Volver a eventos
      </Button>

      <article className="card rp-generate-summary">
        <header className="rp-generate-summary__header">
          <div>
            <h4 className="rp-generate-summary__title">{eventData.eventName}</h4>
            <p className="text-muted rp-generate-summary__meta">
              {eventData.clubName} | {formatDateTime(eventData.startsAt)}
            </p>
          </div>
          <span className="badge badge--success">Activo</span>
        </header>
        <div className="stats-row rp-generate-summary__stats">
          <div>
            <strong>{eventData.usedAccesses}</strong>
            <span>Generados</span>
          </div>
          <div>
            <strong>{eventData.remainingAccesses ?? 'Sin limite'}</strong>
            <span>Restantes</span>
          </div>
          <div>
            <strong>{eventData.limitAccesses ?? 'Sin limite'}</strong>
            <span>Limite</span>
          </div>
        </div>
      </article>

      {limitReached ? (
        <>
          <RpStateView
            icon="warning"
            tone="warning"
            title="Limite alcanzado"
            description="Has agotado tus accesos disponibles para este evento. Contacta a un manager para solicitar mas."
            actions={
              <Button type="button" variant="secondary" onClick={() => navigate('/rp/events')}>
                Volver a mis eventos
              </Button>
            }
          />

          <Button type="button" variant="secondary" block disabled>
            Generar acceso
          </Button>
        </>
      ) : (
        <form className="form-grid rp-generate-form" onSubmit={handleSubmit}>
          <div>
            <span className="form-caption rp-generate-form__label">Tipo de invitado</span>
            <div className="badge-group rp-generate-form__guest-types">
              {guestOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant={guestType === option.value ? 'primary' : 'secondary'}
                  onClick={() => setGuestType(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <Input
            label="Nota (opcional)"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Nombre del invitado, mesa, etc."
            maxLength={100}
          />

          <Button type="submit" loading={mutation.isPending} block>
            {mutation.isPending ? 'Generando...' : 'Generar acceso'}
          </Button>

          {mutation.isError ? (
            <div className="rp-generate-error">
              <RpStateView
                icon="error"
                tone="error"
                title="Error al generar acceso"
                description={generationErrorCopy}
                actions={
                  <Button type="button" variant="secondary" onClick={() => mutation.reset()}>
                    Reintentar
                  </Button>
                }
              />
              {shouldRenderDetailedError ? <p className="text-muted rp-generate-error__detail">{detailedErrorMessage}</p> : null}
            </div>
          ) : null}
        </form>
      )}
    </div>
  )
}
