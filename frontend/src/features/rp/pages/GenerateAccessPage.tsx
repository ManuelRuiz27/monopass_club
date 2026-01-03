import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRpAssignments } from '../hooks'
import { rpApi, type GuestType } from '../api'
import { PagePlaceholder } from '@/components/PagePlaceholder'
import { useToast } from '@/components/ToastProvider'

export function GenerateAccessPage() {
  const toast = useToast()
  const { data, isLoading, error } = useRpAssignments()
  const queryClient = useQueryClient()
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('')
  const [guestType, setGuestType] = useState<GuestType>('GENERAL')
  const [note, setNote] = useState('')
  const [lastTicketId, setLastTicketId] = useState<string | null>(null)
  const [lastGuestType, setLastGuestType] = useState<GuestType>('GENERAL')
  const [shareCopy, setShareCopy] = useState('')

  const mutation = useMutation({
    mutationFn: rpApi.createTicket,
    onSuccess: (ticket) => {
      setLastTicketId(ticket.id)
      setLastGuestType(ticket.guestType)
      setShareCopy(`Acceso ${ticket.guestType} generado para ${ticket.event.name} (${new Date(ticket.event.startsAt).toLocaleDateString()}).`)
      toast.showToast({ title: 'Acceso generado', variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['rp-events'] })
    },
    onError: (err: unknown) => {
      toast.showToast({ title: 'No se pudo generar el acceso', description: err instanceof Error ? err.message : undefined, variant: 'error' })
    },
  })

  const selectedAssignment = useMemo(
    () => data?.events.find((event) => event.assignmentId === selectedAssignmentId),
    [data, selectedAssignmentId],
  )

  const guestOptions: { value: GuestType; label: string }[] = useMemo(
    () => [
      { value: 'GENERAL', label: 'General' },
      { value: 'VIP', label: 'VIP' },
      { value: 'OTHER', label: data?.otherLabel ?? 'Otro' },
    ],
    [data?.otherLabel],
  )

  if (isLoading) {
    return <p>Preparando formulario...</p>
  }

  if (error || !data || data.events.length === 0) {
    return (
      <PagePlaceholder
        title="Aun no tienes eventos para generar accesos"
        description="Pide a tu gerente que te asigne un evento con limite definido."
      />
    )
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedAssignment || !selectedAssignment.eventActive) return
    mutation.mutate({
      eventId: selectedAssignment.eventId,
      guestType,
      note: note ? note.trim() : undefined,
    })
  }

  const previewUrl = lastTicketId ? `${rpApi.getTicketImageUrl(lastTicketId)}?t=${Date.now()}` : null
  const shareUrl = lastTicketId
    ? `https://wa.me/?text=${encodeURIComponent(`${shareCopy} ${rpApi.getTicketImageUrl(lastTicketId)}`)}`
    : null
  const limitReached = selectedAssignment?.remainingAccesses === 0
  const mutationErrorMessage =
    mutation.error instanceof Error
      ? mutation.error.message ?? 'No se pudo crear el ticket'
      : mutation.error
        ? 'No se pudo crear el ticket'
        : null

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Generar acceso</h3>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Evento asignado
          <select
            value={selectedAssignmentId}
            onChange={(e) => {
              setSelectedAssignmentId(e.target.value)
              setLastTicketId(null)
            }}
          >
            <option value="">Selecciona un evento</option>
            {data.events.map((event) => (
              <option key={event.assignmentId} value={event.assignmentId}>
                {event.eventName} - {new Date(event.startsAt).toLocaleDateString()} {event.eventActive ? '' : '(Cerrado)'}
              </option>
            ))}
          </select>
        </label>

        {selectedAssignment && (
          <div className="badge-group">
            <span className="badge">Limite: {selectedAssignment.limitAccesses ?? 'Sin limite'}</span>
            <span className="badge">Generados: {selectedAssignment.usedAccesses}</span>
            <span className="badge">Restantes: {selectedAssignment.remainingAccesses ?? 'Inf'}</span>
          </div>
        )}

        <div>
          <span className="form-caption" style={{ display: 'block', marginBottom: '0.25rem' }}>
            Tipo de invitado
          </span>
          <div className="badge-group">
            {guestOptions.map((option) => (
              <label key={option.value} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <input
                  type="radio"
                  value={option.value}
                  checked={guestType === option.value}
                  onChange={() => setGuestType(option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        <label>
          Nota logistica (opcional)
          <textarea rows={3} value={note} placeholder="Mesa 4, cumpleanos, etc." onChange={(e) => setNote(e.target.value)} />
        </label>

        {!selectedAssignment?.eventActive ? (
          <p className="text-warning">Este evento esta cerrado. Solo puedes consultar historial.</p>
        ) : limitReached ? (
          <p className="text-danger">Limite alcanzado. Solicita mas accesos a tu gerente.</p>
        ) : null}

        <button type="submit" disabled={!selectedAssignment || !selectedAssignment.eventActive || limitReached || mutation.isPending}>
          {mutation.isPending ? 'Generando...' : 'Generar ticket'}
        </button>
      </form>

      {mutationErrorMessage ? <p className="text-danger" style={{ marginTop: '0.75rem' }}>{mutationErrorMessage}</p> : null}

      {lastTicketId && (
        <section className="card" style={{ marginTop: '1.5rem' }}>
          <h4 style={{ marginTop: 0 }}>Ticket generado ({lastGuestType})</h4>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Preview del ticket"
                className="media-frame"
                style={{ width: 220 }}
                data-testid="ticket-preview"
              />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span data-testid="ticket-token" style={{ display: 'none' }}>
                {lastTicketId}
              </span>
              <a href={rpApi.getTicketImageUrl(lastTicketId)} target="_blank" rel="noreferrer">
                Descargar PNG
              </a>
              {shareUrl && (
                <a href={shareUrl} target="_blank" rel="noreferrer">
                  Compartir por WhatsApp
                </a>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
