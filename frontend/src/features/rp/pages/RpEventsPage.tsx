import { useLayoutEffect, useMemo, useRef, type KeyboardEvent } from 'react'
import { gsap } from 'gsap'
import { useNavigate } from 'react-router-dom'
import { useRpAssignments } from '../hooks'
import { RpStateView } from '../components/RpStateView'
import { Button, PageLoadingState } from '@/components/ui'
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

export function RpEventsPage() {
  const navigate = useNavigate()
  const { data, isLoading, error, refetch } = useRpAssignments()
  const screenRef = useRef<HTMLDivElement | null>(null)
  const prefersReducedMotion = usePrefersReducedMotion()

  const activeEvents = useMemo(() => {
    if (!data) return []
    return data.events.filter((event) => event.eventActive)
  }, [data])

  useGsapInteractiveScale(screenRef, '.rp-event-card', activeEvents.length, { hoverScale: 1.015, pressScale: 0.985 })

  const openGenerate = (assignmentId: string) => {
    navigate(`/rp/generate/${assignmentId}`)
  }

  const handleCardKeyDown = (event: KeyboardEvent<HTMLElement>, assignmentId: string) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    openGenerate(assignmentId)
  }

  useLayoutEffect(() => {
    if (prefersReducedMotion) return

    const scope = screenRef.current
    if (!scope) return

    const header = scope.querySelector<HTMLElement>('.rp-screen__header')
    const cards = gsap.utils.toArray<HTMLElement>('.rp-event-card', scope)

    const timeline = gsap.timeline({ defaults: { ease: 'power2.out' } })

    if (header) {
      timeline.fromTo(
        header,
        { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, duration: 0.24, clearProps: 'opacity,transform' },
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
        <header className="rp-screen__header">
          <h3 className="rp-screen__title">Mis eventos</h3>
          <p className="rp-screen__description">Selecciona un evento para generar accesos.</p>
        </header>

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
        <header className="rp-screen__header">
          <h3 className="rp-screen__title">Mis eventos</h3>
          <p className="rp-screen__description">Selecciona un evento para generar accesos.</p>
        </header>

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
      <header className="rp-screen__header">
        <h3 className="rp-screen__title">Mis eventos</h3>
        <p className="rp-screen__description">Selecciona un evento para generar accesos.</p>
      </header>

      <div className="card-grid rp-event-grid">
        {activeEvents.map((event) => (
          <article
            key={event.assignmentId}
            className="card event-select-card rp-event-card"
            onClick={() => openGenerate(event.assignmentId)}
            onKeyDown={(keyboardEvent) => handleCardKeyDown(keyboardEvent, event.assignmentId)}
            role="button"
            tabIndex={0}
          >
            <header className="rp-event-card__header">
              <h4 className="rp-event-card__title">{event.eventName}</h4>
              <p className="text-muted rp-event-card__club">{event.clubName}</p>
            </header>
            <p className="rp-event-card__meta">{formatDateTime(event.startsAt)}</p>
            <div className="stats-row rp-event-card__stats">
              <div>
                <strong>{event.usedAccesses}</strong>
                <span>Generados</span>
              </div>
              <div>
                <strong>{event.remainingAccesses ?? 'Sin limite'}</strong>
                <span>Restantes</span>
              </div>
              <div>
                <strong>{event.limitAccesses ?? 'Sin limite'}</strong>
                <span>Limite</span>
              </div>
            </div>
            <div className="badge-group">
              <span className="badge">General: {event.guestTypeCounts.GENERAL}</span>
              <span className="badge">VIP: {event.guestTypeCounts.VIP}</span>
              <span className="badge">
                {data.otherLabel}: {event.guestTypeCounts.OTHER}
              </span>
            </div>
            <p className="text-muted rp-event-card__cta">Toca para generar</p>
          </article>
        ))}
      </div>
    </div>
  )
}
