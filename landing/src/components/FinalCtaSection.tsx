import { type FormEvent, useMemo, useRef, useState } from 'react'
import { z } from 'zod'
import { createLandingLead } from '../lib/publicApi.ts'
import { trackLandingEvent } from '../lib/analytics.ts'
import { getStoredUtm } from '../lib/utm.ts'

type MonthlyPlan = 'club' | 'pro' | null

type FinalCtaSectionProps = {
  selectedPlan: MonthlyPlan
  eventPriceLabel: string
  onActivateEvent: () => void
}

const leadSchema = z.object({
  name: z.string().trim().min(2, 'Escribe tu nombre.'),
  club: z.string().trim().min(2, 'Escribe el nombre del club o evento.'),
  city: z.string().trim().min(2, 'Escribe tu ciudad.'),
  phone: z.string().trim().min(8, 'Escribe un telefono valido.'),
  eventDate: z.string().optional().or(z.literal('')),
})

type LeadFormValues = z.infer<typeof leadSchema>
type LeadErrors = Partial<Record<keyof LeadFormValues | 'form', string>>

function planLabel(plan: MonthlyPlan) {
  if (plan === 'club') return 'Interes detectado: Plan Club (4 eventos/mes).'
  if (plan === 'pro') return 'Interes detectado: Plan Pro (12 eventos/mes).'
  return null
}

export function FinalCtaSection({ selectedPlan, eventPriceLabel, onActivateEvent }: FinalCtaSectionProps) {
  const [errors, setErrors] = useState<LeadErrors>({})
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [serverMessage, setServerMessage] = useState<string | null>(null)
  const startedRef = useRef(false)
  const formRef = useRef<HTMLFormElement>(null)

  const selectedPlanLabel = useMemo(() => planLabel(selectedPlan), [selectedPlan])

  const handleScheduleDemoClick = () => {
    trackLandingEvent('cta_schedule_demo_click', { location: 'cta_final' })
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    const firstField = formRef.current?.querySelector<HTMLInputElement>('input[name="name"]')
    firstField?.focus()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrors({})
    setServerMessage(null)

    trackLandingEvent('lead_form_submit_attempt', {
      action: 'lead',
      location: 'cta_final',
      selectedPlan: selectedPlan ?? 'none',
    })

    const formData = new FormData(event.currentTarget)
    const raw: LeadFormValues = {
      name: String(formData.get('name') ?? ''),
      club: String(formData.get('club') ?? ''),
      city: String(formData.get('city') ?? ''),
      phone: String(formData.get('phone') ?? ''),
      eventDate: String(formData.get('eventDate') ?? ''),
    }

    const parsed = leadSchema.safeParse(raw)
    if (!parsed.success) {
      const nextErrors: LeadErrors = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof LeadFormValues
        if (!nextErrors[field]) nextErrors[field] = issue.message
      }
      setErrors(nextErrors)
      trackLandingEvent('lead_form_submit_validation_error', {
        action: 'lead',
        location: 'cta_final',
        invalidFields: Object.keys(nextErrors),
      })
      return
    }

    setSending(true)

    try {
      // Preserve UTMs with each lead to keep attribution intact in CRM.
      await createLandingLead({
        name: parsed.data.name,
        club: parsed.data.club,
        city: parsed.data.city,
        phone: parsed.data.phone,
        eventDate: parsed.data.eventDate || undefined,
        utm: getStoredUtm(),
      })
      setSent(true)
      trackLandingEvent('lead_form_submit_success', {
        action: 'lead',
        location: 'cta_final',
        selectedPlan: selectedPlan ?? 'none',
      })
    } catch {
      const message = 'No pudimos registrar tu demo. Intenta nuevamente.'
      setServerMessage(message)
      setErrors({ form: message })
      trackLandingEvent('lead_form_submit_error', {
        action: 'lead',
        location: 'cta_final',
        selectedPlan: selectedPlan ?? 'none',
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="landing-section" id="cta-final" aria-labelledby="final-cta-title" data-reveal>
      <div className="landing-container">
        <div className="final-cta-shell" data-reveal>
          <header className="section-header section-header--compact">
            <p className="section-header__eyebrow">Siguiente paso</p>
            <h2 className="section-header__title" id="final-cta-title">
              Activa hoy o agenda demo para tu siguiente fecha fuerte.
            </h2>
            <p className="section-header__description">
              Pass Monkey funciona para equipos de club, productores de eventos y venues privados que necesitan control
              real en puerta.
            </p>
          </header>

          <div className="final-cta-shell__actions">
            <button type="button" className="pm-button pm-button--primary" onClick={onActivateEvent}>
              Activar 1 evento por {eventPriceLabel}
            </button>
            <button type="button" className="pm-button pm-button--secondary" onClick={handleScheduleDemoClick}>
              Agendar demo
            </button>
          </div>

          {selectedPlanLabel && <p className="final-cta-shell__plan-hint">{selectedPlanLabel}</p>}
          <div className="final-cta-shell__proofs" aria-label="Tipo de operaciones atendidas">
            <span>Clubes nocturnos</span>
            <span>Bares y restaurantes con DJ</span>
            <span>Corporativos y eventos privados</span>
          </div>

          <form
            ref={formRef}
            className="lead-form"
            onSubmit={handleSubmit}
            onFocusCapture={() => {
              if (startedRef.current) return
              startedRef.current = true
              trackLandingEvent('lead_form_started', { location: 'cta_final' })
            }}
            noValidate
          >
            <div className="lead-form__grid">
              <label className="lead-field" htmlFor="demo-name">
                Nombre
                <input id="demo-name" name="name" type="text" autoComplete="name" />
                {errors.name && <span className="lead-field__error">{errors.name}</span>}
              </label>

              <label className="lead-field" htmlFor="demo-club">
                Club o evento
                <input id="demo-club" name="club" type="text" autoComplete="organization" />
                {errors.club && <span className="lead-field__error">{errors.club}</span>}
              </label>

              <label className="lead-field" htmlFor="demo-city">
                Ciudad
                <input id="demo-city" name="city" type="text" autoComplete="address-level2" />
                {errors.city && <span className="lead-field__error">{errors.city}</span>}
              </label>

              <label className="lead-field" htmlFor="demo-phone">
                Telefono
                <input id="demo-phone" name="phone" type="tel" autoComplete="tel" />
                {errors.phone && <span className="lead-field__error">{errors.phone}</span>}
              </label>

              <label className="lead-field" htmlFor="demo-date">
                Fecha estimada del evento
                <input id="demo-date" name="eventDate" type="date" />
                {errors.eventDate && <span className="lead-field__error">{errors.eventDate}</span>}
              </label>
            </div>

            {serverMessage && (
              <p className="lead-form__feedback lead-form__feedback--error" role="status">
                {serverMessage}
              </p>
            )}

            {sent && (
              <p className="lead-form__feedback" role="status">
                Demo solicitada. Nuestro equipo te contacta en breve.
              </p>
            )}

            <button type="submit" className="pm-button pm-button--primary" disabled={sending}>
              {sending ? 'Enviando solicitud...' : 'Enviar demo'}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}

