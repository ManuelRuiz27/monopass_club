import { type FormEvent, useRef, useState } from 'react'
import { z } from 'zod'
import { createLandingLead } from '../lib/publicApi.ts'
import { trackLandingEvent } from '../lib/analytics.ts'
import { getStoredUtm } from '../lib/utm.ts'

const leadSchema = z.object({
  name: z.string().trim().min(2, 'Nombre requerido'),
  club: z.string().trim().min(2, 'Nombre de club requerido'),
  city: z.string().trim().min(2, 'Ciudad requerida'),
  phone: z.string().trim().min(8, 'Telefono invalido'),
  email: z.string().trim().email('Email invalido').optional().or(z.literal('')),
  eventDate: z.string().optional().or(z.literal('')),
  estimatedVolume: z.string().optional().or(z.literal('')),
})

type LeadData = z.infer<typeof leadSchema>
type FieldErrors = Partial<Record<keyof LeadData | 'form', string>>

function parseEstimatedVolume(value: string | undefined) {
  if (!value || value.trim().length === 0) return undefined
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return Math.round(parsed)
}

export function LeadForm() {
  const [errors, setErrors] = useState<FieldErrors>({})
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const startedRef = useRef(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrors({})

    trackLandingEvent('lead_form_submit_attempt', { action: 'lead', location: 'lead_form' })

    const fd = new FormData(e.currentTarget)
    const raw = {
      name: String(fd.get('name') ?? ''),
      club: String(fd.get('club') ?? ''),
      city: String(fd.get('city') ?? ''),
      phone: String(fd.get('phone') ?? ''),
      email: String(fd.get('email') ?? ''),
      eventDate: String(fd.get('eventDate') ?? ''),
      estimatedVolume: String(fd.get('estimatedVolume') ?? ''),
    }

    const result = leadSchema.safeParse(raw)
    if (!result.success) {
      const fieldErrors: FieldErrors = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof LeadData
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      const invalidFields = [...new Set(result.error.issues.map((issue) => String(issue.path[0] ?? 'unknown')))]
      trackLandingEvent('lead_form_submit_validation_error', { action: 'lead', invalidFields, location: 'lead_form' })
      return
    }

    const estimatedVolume = parseEstimatedVolume(result.data.estimatedVolume)
    if (estimatedVolume === null) {
      setErrors({ estimatedVolume: 'Volumen estimado invalido' })
      trackLandingEvent('lead_form_submit_validation_error', {
        action: 'lead',
        invalidFields: ['estimatedVolume'],
        location: 'lead_form',
      })
      return
    }

    setSending(true)
    try {
      trackLandingEvent('cta_schedule_demo_click', { location: 'lead_form' })
      await createLandingLead({
        name: result.data.name,
        club: result.data.club,
        city: result.data.city,
        phone: result.data.phone,
        email: result.data.email || undefined,
        eventDate: result.data.eventDate || undefined,
        estimatedVolume: estimatedVolume ?? undefined,
        utm: getStoredUtm(),
      })
      setSent(true)
      trackLandingEvent('lead_form_submit_success', { action: 'lead', location: 'lead_form' })
    } catch {
      setErrors({ form: 'No se pudo registrar tu solicitud. Intenta de nuevo.' })
      trackLandingEvent('lead_form_submit_error', { action: 'lead', location: 'lead_form' })
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <section className="lead" id="formulario">
        <div className="lead__success">
          <span className="lead__success-icon">OK</span>
          <h3>Solicitud recibida</h3>
          <p>Tu prospecto ya se registro. Nuestro equipo te contacta para agendar la reunion.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="lead" id="formulario">
      <div className="lead__brand">
        <img src="/assets/logos/pass-monkey-mascot-3d.png" alt="" aria-hidden="true" />
        <img src="/assets/logos/pass-monkey-neon-letters.png" alt="Pass Monkey" />
      </div>
      <h2 className="lead__title">Agenda una reunion con nuestro equipo</h2>
      <p className="lead__subtitle">
        Registrate y te contactamos para definir una implementacion exclusiva para tu club.
      </p>

      <form
        className="lead__form"
        onSubmit={handleSubmit}
        onFocusCapture={() => {
          if (startedRef.current) return
          startedRef.current = true
          trackLandingEvent('lead_form_started', { location: 'lead_form' })
        }}
        noValidate
      >
        <div className="lead__field">
          <label className="lead__label" htmlFor="lead-name">
            Nombre
          </label>
          <input className="lead__input" id="lead-name" name="name" placeholder="Tu nombre completo" />
          {errors.name && <span className="lead__error">{errors.name}</span>}
        </div>

        <div className="lead__field">
          <label className="lead__label" htmlFor="lead-club">
            Club / Evento
          </label>
          <input className="lead__input" id="lead-club" name="club" placeholder="Nombre del club o evento" />
          {errors.club && <span className="lead__error">{errors.club}</span>}
        </div>

        <div className="lead__row">
          <div className="lead__field">
            <label className="lead__label" htmlFor="lead-city">
              Ciudad
            </label>
            <input className="lead__input" id="lead-city" name="city" placeholder="Ciudad" />
            {errors.city && <span className="lead__error">{errors.city}</span>}
          </div>

          <div className="lead__field">
            <label className="lead__label" htmlFor="lead-phone">
              Telefono
            </label>
            <input className="lead__input" id="lead-phone" name="phone" type="tel" placeholder="+52 ..." />
            {errors.phone && <span className="lead__error">{errors.phone}</span>}
          </div>
        </div>

        <div className="lead__row">
          <div className="lead__field">
            <label className="lead__label" htmlFor="lead-email">
              Email <span style={{ opacity: 0.5 }}>(opcional)</span>
            </label>
            <input className="lead__input" id="lead-email" name="email" type="email" placeholder="correo@ejemplo.com" />
            {errors.email && <span className="lead__error">{errors.email}</span>}
          </div>

          <div className="lead__field">
            <label className="lead__label" htmlFor="lead-event-date">
              Fecha tentativa de reunion <span style={{ opacity: 0.5 }}>(opcional)</span>
            </label>
            <input className="lead__input" id="lead-event-date" name="eventDate" type="date" />
            {errors.eventDate && <span className="lead__error">{errors.eventDate}</span>}
          </div>
        </div>

        <div className="lead__field">
          <label className="lead__label" htmlFor="lead-volume">
            Volumen estimado de asistentes <span style={{ opacity: 0.5 }}>(opcional)</span>
          </label>
          <input className="lead__input" id="lead-volume" name="estimatedVolume" type="number" min={1} placeholder="Ej. 350" />
          {errors.estimatedVolume && <span className="lead__error">{errors.estimatedVolume}</span>}
        </div>

        {errors.form && <p className="lead__error">{errors.form}</p>}

        <div className="lead__actions">
          <button
            type="submit"
            className="btn btn--primary"
            disabled={sending}
          >
            {sending ? 'Enviando...' : 'AGENDAR REUNION'}
          </button>
        </div>
      </form>
    </section>
  )
}
