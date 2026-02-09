import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRpAssignments } from '../hooks'
import { rpApi, type GuestType, type RpEventAssignment } from '../api'
import { PagePlaceholder } from '@/components/PagePlaceholder'
import { useToast } from '@/components/ToastProvider'

export function GenerateAccessPage() {
  const toast = useToast()
  const { data, isLoading, error } = useRpAssignments()
  const queryClient = useQueryClient()

  const [activeEvent, setActiveEvent] = useState<RpEventAssignment | null>(null)
  const [guestType, setGuestType] = useState<GuestType>('GENERAL')
  const [note, setNote] = useState('')
  const [lastTicketId, setLastTicketId] = useState<string | null>(null)
  const [lastGuestType, setLastGuestType] = useState<GuestType>('GENERAL')
  const [shareCopy, setShareCopy] = useState('')
  const [ticketImageUrl, setTicketImageUrl] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (ticketImageUrl) {
        URL.revokeObjectURL(ticketImageUrl)
      }
    }
  }, [ticketImageUrl])

  const mutation = useMutation({
    mutationFn: rpApi.createTicket,
    onSuccess: async (ticket) => {
      setLastTicketId(ticket.id)
      setLastGuestType(ticket.guestType)
      setShareCopy(`Acceso ${ticket.guestType} generado para ${ticket.event.name} (${new Date(ticket.event.startsAt).toLocaleDateString()}).`)
      toast.showToast({ title: 'Acceso generado', variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['rp-events'] })

      try {
        const ticketImage = await rpApi.getTicketImage(ticket.id)
        const nextUrl = URL.createObjectURL(ticketImage)
        setTicketImageUrl((previous) => {
          if (previous) {
            URL.revokeObjectURL(previous)
          }
          return nextUrl
        })
      } catch (error) {
        setTicketImageUrl((previous) => {
          if (previous) {
            URL.revokeObjectURL(previous)
          }
          return null
        })
        toast.showToast({
          title: 'Ticket generado sin vista previa',
          description: error instanceof Error ? error.message : undefined,
          variant: 'info',
        })
      }
    },
    onError: (error: unknown) => {
      toast.showToast({
        title: 'No se pudo generar el acceso',
        description: error instanceof Error ? error.message : undefined,
        variant: 'error',
      })
    },
  })

  const guestOptions: { value: GuestType; label: string }[] = useMemo(
    () => [
      { value: 'GENERAL', label: 'General' },
      { value: 'VIP', label: 'VIP' },
      { value: 'OTHER', label: data?.otherLabel ?? 'Otro' },
    ],
    [data?.otherLabel],
  )

  const activeEvents = useMemo(() => {
    if (!data) return []
    return data.events.filter((event) => event.eventActive)
  }, [data])

  const currentEventData = useMemo(() => {
    if (!activeEvent || !data) return null
    return data.events.find((event) => event.assignmentId === activeEvent.assignmentId) ?? null
  }, [activeEvent, data])

  if (isLoading) {
    return <p>Cargando eventos...</p>
  }

  if (error || !data) {
    return (
      <PagePlaceholder
        title="Error al cargar eventos"
        description="No se pudieron cargar tus eventos asignados. Intenta de nuevo."
      />
    )
  }

  if (activeEvents.length === 0) {
    return (
      <PagePlaceholder
        title="Sin eventos activos"
        description="No tienes eventos activos asignados. Pide a tu gerente que te asigne un evento."
      />
    )
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!currentEventData) return
    mutation.mutate({
      eventId: currentEventData.eventId,
      guestType,
      note: note ? note.trim() : undefined,
    })
  }

  const handleQuickGenerate = () => {
    if (!currentEventData || currentEventData.remainingAccesses === 0) return
    setNote('')
    mutation.mutate({
      eventId: currentEventData.eventId,
      guestType,
      note: undefined,
    })
  }

  const handleBackToEvents = () => {
    setActiveEvent(null)
    setLastTicketId(null)
    setNote('')
    setTicketImageUrl((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous)
      }
      return null
    })
  }

  const previewUrl = ticketImageUrl
  const shareUrl = lastTicketId ? `https://wa.me/?text=${encodeURIComponent(`${shareCopy} Codigo: ${lastTicketId}`)}` : null
  const limitReached = currentEventData?.remainingAccesses === 0

  if (!activeEvent) {
    return (
      <div>
        <h3 style={{ marginTop: 0 }}>Mis eventos</h3>
        <p className="text-muted" style={{ marginTop: 0 }}>
          Selecciona un evento para generar accesos.
        </p>

        <div className="card-grid" style={{ marginTop: '1rem' }}>
          {activeEvents.map((event) => (
            <article
              key={event.assignmentId}
              className="card event-select-card"
              onClick={() => setActiveEvent(event)}
              style={{ cursor: 'pointer' }}
            >
              <header>
                <h4 style={{ margin: 0 }}>{event.eventName}</h4>
                <p className="text-muted" style={{ margin: '0.25rem 0 0' }}>
                  {event.clubName}
                </p>
              </header>
              <p style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>
                {new Date(event.startsAt).toLocaleDateString()} ·{' '}
                {new Date(event.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <div className="stats-row" style={{ margin: '0.75rem 0', padding: '0.5rem 0' }}>
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
              <div className="badge-group" style={{ marginTop: '0.5rem' }}>
                <span className="badge">General: {event.guestTypeCounts.GENERAL}</span>
                <span className="badge">VIP: {event.guestTypeCounts.VIP}</span>
                <span className="badge">
                  {data.otherLabel}: {event.guestTypeCounts.OTHER}
                </span>
              </div>
              <p className="text-muted" style={{ margin: '0.75rem 0 0', fontSize: '0.8rem', textAlign: 'center' }}>
                Toca para generar
              </p>
            </article>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <button type="button" className="button--ghost" onClick={handleBackToEvents} style={{ marginBottom: '1rem' }}>
        Volver a eventos
      </button>

      <article className="card" style={{ marginBottom: '1rem' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ margin: 0 }}>{currentEventData?.eventName}</h4>
            <p style={{ margin: 0 }} className="text-muted">
              {currentEventData?.clubName} · {new Date(currentEventData?.startsAt ?? '').toLocaleString()}
            </p>
          </div>
          <span className="badge badge--success">Activo</span>
        </header>
        <div className="stats-row" style={{ marginTop: '0.75rem' }}>
          <div>
            <strong>{currentEventData?.usedAccesses}</strong>
            <span>Generados</span>
          </div>
          <div>
            <strong>{currentEventData?.remainingAccesses ?? 'Sin limite'}</strong>
            <span>Restantes</span>
          </div>
          <div>
            <strong>{currentEventData?.limitAccesses ?? 'Sin limite'}</strong>
            <span>Limite</span>
          </div>
        </div>
      </article>

      <form className="form-grid" onSubmit={handleSubmit}>
        <div>
          <span className="form-caption" style={{ display: 'block', marginBottom: '0.25rem' }}>
            Tipo de invitado
          </span>
          <div className="badge-group">
            {guestOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={guestType === option.value ? '' : 'button--ghost'}
                onClick={() => setGuestType(option.value)}
                style={{ padding: '0.5rem 1rem' }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <label>
          Nota (opcional)
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Nombre del invitado, mesa, etc."
            maxLength={100}
          />
        </label>

        {limitReached && <p className="text-warning">Has alcanzado el limite de accesos para este evento.</p>}

        <button type="submit" disabled={mutation.isPending || limitReached}>
          {mutation.isPending ? 'Generando...' : 'Generar acceso'}
        </button>
      </form>

      {mutation.isError && (
        <p className="text-danger" style={{ marginTop: '0.75rem' }}>
          {mutation.error instanceof Error ? mutation.error.message : 'Error al generar'}
        </p>
      )}

      {lastTicketId && (
        <section className="card ticket-success-card" style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h4 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Ticket generado ({lastGuestType})</h4>
              <p className="text-muted" style={{ margin: 0, fontSize: '0.875rem' }}>
                Listo para compartir o descargar
              </p>
            </div>
            <button
              type="button"
              onClick={handleQuickGenerate}
              disabled={limitReached || mutation.isPending}
              className="quick-generate-btn"
              style={{
                background: 'linear-gradient(135deg, var(--accent-success), #16a34a)',
                fontSize: '1rem',
                padding: '0.75rem 1.25rem',
              }}
            >
              {mutation.isPending ? 'Generando...' : 'Generar otro'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '1rem' }}>
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Preview del ticket"
                className="media-frame"
                style={{ width: 200 }}
                data-testid="ticket-preview"
                data-ticket-id={lastTicketId}
              />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {previewUrl && (
                <a
                  href={previewUrl}
                  download={`ticket-${lastTicketId}.png`}
                  className="button button--ghost"
                  style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                >
                  Descargar PNG
                </a>
              )}
              {shareUrl && (
                <a href={shareUrl} target="_blank" rel="noreferrer" className="button button--ghost" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                  Compartir WhatsApp
                </a>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
