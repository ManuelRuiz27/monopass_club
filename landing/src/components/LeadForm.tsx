import { type FormEvent, useRef, useState } from 'react'
import { z } from 'zod'
import { createLandingActivation, createLandingLead } from '../lib/publicApi.ts'
import { trackLandingEvent } from '../lib/analytics.ts'
import { getStoredUtm } from '../lib/utm.ts'

const leadSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  club: z.string().min(2, 'Nombre de club requerido'),
  city: z.string().min(2, 'Ciudad requerida'),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha invalida'),
  estimatedVolume: z.coerce.number().int().min(1, 'Minimo 1 acceso estimado'),
  phone: z.string().min(8, 'Telefono invalido'),
  email: z.string().email('Email invalido').optional().or(z.literal('')),
})

type LeadData = z.infer<typeof leadSchema>
type FieldErrors = Partial<Record<keyof LeadData, string>>
type SubmitAction = 'lead' | 'activation'

function extractOrderId(paymentUrl: string) {
  try {
    const url = new URL(paymentUrl, window.location.origin)
    return url.searchParams.get('orderId') ?? undefined
  } catch {
    return undefined
  }
}

export function LeadForm() {
  const [errors, setErrors] = useState<FieldErrors>({})
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [submitAction, setSubmitAction] = useState<SubmitAction>('lead')
  const startedRef = useRef(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrors({})
    setStatusMessage(null)

    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
    const action = (submitter?.dataset.action as SubmitAction | undefined) ?? 'lead'
    setSubmitAction(action)
    trackLandingEvent('lead_form_submit_attempt', { action, location: 'lead_form' })

    const fd = new FormData(e.currentTarget)
    const raw = {
      name: fd.get('name') as string,
      club: fd.get('club') as string,
      city: fd.get('city') as string,
      eventDate: fd.get('eventDate') as string,
      estimatedVolume: Number(fd.get('estimatedVolume')),
      phone: fd.get('phone') as string,
      email: (fd.get('email') as string) || '',
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
      trackLandingEvent('lead_form_submit_validation_error', { action, invalidFields, location: 'lead_form' })
      return
    }

    setSending(true)
    try {
      if (action === 'activation') {
        trackLandingEvent('cta_activate_event_click', { location: 'lead_form' })

        if (!result.data.email) {
          setErrors({ email: 'Email requerido para crear checkout.' })
          trackLandingEvent('lead_form_submit_validation_error', {
            action,
            invalidFields: ['email'],
            location: 'lead_form',
          })
          return
        }

        trackLandingEvent('activation_submit_attempt', { location: 'lead_form' })
        const activation = await createLandingActivation({
          clubName: result.data.club,
          city: result.data.city,
          ownerName: result.data.name,
          ownerEmail: result.data.email,
          phone: result.data.phone,
          utm: getStoredUtm(),
        })

        if (activation.status === 201) {
          const paymentUrl = activation.body.paymentUrl
          if (typeof paymentUrl === 'string') {
            trackLandingEvent('activation_redirect_checkout', {
              location: 'lead_form',
              orderId: extractOrderId(paymentUrl),
            })
            window.location.href = paymentUrl
            return
          }
        }

        const apiMessage =
          typeof activation.body.message === 'string'
            ? activation.body.message
            : 'No fue posible iniciar el checkout por ahora.'
        setStatusMessage(apiMessage)
        trackLandingEvent('activation_submit_error', { location: 'lead_form', status: activation.status })
        return
      }

      trackLandingEvent('cta_schedule_demo_click', { location: 'lead_form' })
      await createLandingLead({
        name: result.data.name,
        club: result.data.club,
        city: result.data.city,
        eventDate: result.data.eventDate,
        estimatedVolume: result.data.estimatedVolume,
        phone: result.data.phone,
        email: result.data.email || undefined,
        utm: getStoredUtm(),
      })
      setSent(true)
      trackLandingEvent('lead_form_submit_success', { action: 'lead', location: 'lead_form' })
    } catch {
      setErrors({ email: 'Error de conexion. Intenta de nuevo.' })
      trackLandingEvent('lead_form_submit_error', { action, location: 'lead_form' })
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <section className="lead" id="formulario">
        <div className="lead__success">
          <span className="lead__success-icon">OK</span>
          <h3>Tu acceso quedo en lista prioritaria</h3>
          <p>Ventas te contacta para activar tu fecha y dejar tu puerta lista.</p>
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
      <h2 className="lead__title">Agenda tu acceso VIP a Pass Monkey</h2>
      <p className="lead__subtitle">
        Comparte tu siguiente fecha y te llevamos de flyer a puerta en modo premium.
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
          <input className="lead__input" id="lead-club" name="club" placeholder="Nombre del club o marca del evento" />
          {errors.club && <span className="lead__error">{errors.club}</span>}
        </div>

        <div className="lead__row">
          <div className="lead__field">
            <label className="lead__label" htmlFor="lead-city">
              Ciudad
            </label>
            <input className="lead__input" id="lead-city" name="city" placeholder="Tu ciudad" />
            {errors.city && <span className="lead__error">{errors.city}</span>}
          </div>

          <div className="lead__field">
            <label className="lead__label" htmlFor="lead-event-date">
              Fecha del evento
            </label>
            <input className="lead__input" id="lead-event-date" name="eventDate" type="date" />
            {errors.eventDate && <span className="lead__error">{errors.eventDate}</span>}
          </div>
        </div>

        <div className="lead__row">
          <div className="lead__field">
            <label className="lead__label" htmlFor="lead-phone">
              Telefono
            </label>
            <input className="lead__input" id="lead-phone" name="phone" type="tel" placeholder="+52 ..." />
            {errors.phone && <span className="lead__error">{errors.phone}</span>}
          </div>

          <div className="lead__field">
            <label className="lead__label" htmlFor="lead-volume">
              Accesos estimados
            </label>
            <input className="lead__input" id="lead-volume" name="estimatedVolume" type="number" min="1" placeholder="250" />
            {errors.estimatedVolume && <span className="lead__error">{errors.estimatedVolume}</span>}
          </div>
        </div>

        <div className="lead__field">
          <label className="lead__label" htmlFor="lead-email">
            Email <span style={{ opacity: 0.5 }}>(obligatorio para checkout)</span>
          </label>
          <input className="lead__input" id="lead-email" name="email" type="email" placeholder="correo@ejemplo.com" />
          {errors.email && <span className="lead__error">{errors.email}</span>}
        </div>

        {statusMessage && <p className="lead__error">{statusMessage}</p>}

        <div className="lead__actions">
          <button
            type="submit"
            className="btn btn--primary"
            disabled={sending}
            data-action="activation"
          >
            {sending && submitAction === 'activation' ? 'Conectando checkout...' : 'ACTIVAR 1 EVENTO'}
          </button>
          <button
            type="submit"
            className="btn btn--secondary"
            disabled={sending}
            data-action="lead"
          >
            {sending && submitAction === 'lead' ? 'Enviando...' : 'AGENDAR DEMO'}
          </button>
        </div>
      </form>
    </section>
  )
}
