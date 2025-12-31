import { FormEvent, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRpAssignments } from '../hooks'
import { rpApi, type GuestType } from '../api'
import { PagePlaceholder } from '@/components/PagePlaceholder'

export function GenerateAccessPage() {
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
      setShareCopy(
        `Acceso ${ticket.guestType} generado para ${ticket.event.name} (${new Date(ticket.event.startsAt).toLocaleDateString()}).`,
      )
      queryClient.invalidateQueries({ queryKey: ['rp-events'] })
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

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!selectedAssignment) return
    mutation.mutate({
      eventId: selectedAssignment.eventId,
      guestType,
      note: note ? note.trim() : undefined,
    })
  }

  const previewUrl = lastTicketId ? `${rpApi.getTicketImageUrl(lastTicketId)}?t=${Date.now()}` : null
  const shareUrl = lastTicketId ? `https://wa.me/?text=${encodeURIComponent(`${shareCopy} ${rpApi.getTicketImageUrl(lastTicketId)}`)}` : null

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
                {event.eventName} — {new Date(event.startsAt).toLocaleDateString()}
              </option>
            ))}
          </select>
        </label>

        {selectedAssignment && (
          <div className="badge-group">
            <span className="badge">Limite: {selectedAssignment.limitAccesses ?? 'Sin limite'}</span>
            <span className="badge">Generados: {selectedAssignment.usedAccesses}</span>
            <span className="badge">
              Restantes: {selectedAssignment.remainingAccesses ?? 'Sin limite'}
            </span>
          </div>
        )}

        <div>
          <span style={{ display: 'block', marginBottom: '0.25rem', color: '#475569', fontSize: '0.9rem' }}>
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

        <button type="submit" disabled={!selectedAssignment || mutation.isPending} data-testid="generate-btn">
          {mutation.isPending ? 'Generando...' : 'Generar ticket'}
        </button>
      </form>

      {mutation.error && (
        <p style={{ color: '#b91c1c', marginTop: '0.75rem' }}>
          {(mutation.error as Error).message ?? 'No se pudo crear el ticket'}
        </p>
      )}

      {lastTicketId && (
        <section className="card" style={{ marginTop: '1.5rem' }}>
          <h4 style={{ marginTop: 0 }}>Ticket generado ({lastGuestType})</h4>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Preview del ticket"
                style={{ width: 220, borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}
                data-testid="ticket-preview"
              />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span data-testid="ticket-token" style={{ display: 'none' }}>{lastTicketId}</span>
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
