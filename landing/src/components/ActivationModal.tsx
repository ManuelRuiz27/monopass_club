import { type FormEvent, useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { createLandingActivation } from '../lib/publicApi.ts'
import { trackLandingEvent } from '../lib/analytics.ts'
import { getStoredUtm } from '../lib/utm.ts'

type ActivationModalProps = {
  open: boolean
  eventPriceLabel: string
  onClose: () => void
}

const activationSchema = z.object({
  ownerName: z.string().trim().min(2, 'Escribe tu nombre.'),
  ownerEmail: z.string().trim().email('Escribe un correo valido.'),
  clubName: z.string().trim().min(2, 'Escribe el nombre del club o evento.'),
  city: z.string().trim().min(2, 'Escribe la ciudad del evento.'),
  phone: z.string().trim().min(8, 'Escribe un telefono valido.'),
})

type ActivationValues = z.infer<typeof activationSchema>
type ActivationErrors = Partial<Record<keyof ActivationValues | 'form', string>>

function parseOrderId(paymentUrl: string) {
  try {
    const url = new URL(paymentUrl, window.location.origin)
    return url.searchParams.get('orderId') ?? undefined
  } catch {
    return undefined
  }
}

export function ActivationModal({ open, eventPriceLabel, onClose }: ActivationModalProps) {
  const [sending, setSending] = useState(false)
  const [errors, setErrors] = useState<ActivationErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    if (!open) {
      setSending(false)
      setErrors({})
      setApiError(null)
      startedRef.current = false
      return
    }

    trackLandingEvent('activation_modal_open', { location: 'landing' })

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      trackLandingEvent('activation_modal_close', { reason: 'escape' })
      onClose()
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleEscape)
    }
  }, [open, onClose])

  if (!open) return null

  const closeByBackdrop = () => {
    trackLandingEvent('activation_modal_close', { reason: 'backdrop' })
    onClose()
  }

  const closeByButton = () => {
    trackLandingEvent('activation_modal_close', { reason: 'button' })
    onClose()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrors({})
    setApiError(null)

    const formData = new FormData(event.currentTarget)
    const raw: ActivationValues = {
      ownerName: String(formData.get('ownerName') ?? ''),
      ownerEmail: String(formData.get('ownerEmail') ?? ''),
      clubName: String(formData.get('clubName') ?? ''),
      city: String(formData.get('city') ?? ''),
      phone: String(formData.get('phone') ?? ''),
    }

    const parsed = activationSchema.safeParse(raw)
    if (!parsed.success) {
      const nextErrors: ActivationErrors = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof ActivationValues
        if (!nextErrors[field]) nextErrors[field] = issue.message
      }
      setErrors(nextErrors)
      trackLandingEvent('lead_form_submit_validation_error', {
        action: 'activation',
        location: 'activation_modal',
        invalidFields: Object.keys(nextErrors),
      })
      return
    }

    setSending(true)

    try {
      trackLandingEvent('activation_submit_attempt', { location: 'activation_modal' })
      const response = await createLandingActivation({
        ownerName: parsed.data.ownerName,
        ownerEmail: parsed.data.ownerEmail,
        clubName: parsed.data.clubName,
        city: parsed.data.city,
        phone: parsed.data.phone,
        utm: getStoredUtm(),
      })

      if (response.status === 201 && typeof response.body.paymentUrl === 'string') {
        trackLandingEvent('activation_redirect_checkout', {
          location: 'activation_modal',
          orderId: parseOrderId(response.body.paymentUrl),
        })
        window.location.href = response.body.paymentUrl
        return
      }

      const message =
        typeof response.body.message === 'string'
          ? response.body.message
          : 'No fue posible iniciar el checkout en este momento.'

      setApiError(message)
      setErrors({ form: message })
      trackLandingEvent('activation_submit_error', { location: 'activation_modal', status: response.status })
    } catch {
      const message = 'Error de conexion. Intenta nuevamente.'
      setApiError(message)
      setErrors({ form: message })
      trackLandingEvent('activation_submit_error', { location: 'activation_modal', status: 'network_error' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="activation-modal" role="dialog" aria-modal="true" aria-labelledby="activation-modal-title">
      <button type="button" className="activation-modal__backdrop" aria-label="Cerrar" onClick={closeByBackdrop} />
      <div className="activation-modal__panel">
        <header className="activation-modal__header">
          <h2 id="activation-modal-title">Activar 1 evento por {eventPriceLabel}</h2>
          <button type="button" onClick={closeByButton} className="activation-modal__close" aria-label="Cerrar modal">
            x
          </button>
        </header>
        <p className="activation-modal__subtitle">
          Completa tus datos y te redirigimos al pago seguro para activar tu evento de prueba.
        </p>

        <form
          className="activation-modal__form"
          onSubmit={handleSubmit}
          onFocusCapture={() => {
            if (startedRef.current) return
            startedRef.current = true
            trackLandingEvent('lead_form_started', { location: 'activation_modal' })
          }}
          noValidate
        >
          <label className="lead-field" htmlFor="activation-owner-name">
            Nombre
            <input id="activation-owner-name" name="ownerName" type="text" autoComplete="name" />
            {errors.ownerName && <span className="lead-field__error">{errors.ownerName}</span>}
          </label>

          <label className="lead-field" htmlFor="activation-owner-email">
            Correo
            <input id="activation-owner-email" name="ownerEmail" type="email" autoComplete="email" />
            {errors.ownerEmail && <span className="lead-field__error">{errors.ownerEmail}</span>}
          </label>

          <label className="lead-field" htmlFor="activation-club-name">
            Club o evento
            <input id="activation-club-name" name="clubName" type="text" autoComplete="organization" />
            {errors.clubName && <span className="lead-field__error">{errors.clubName}</span>}
          </label>

          <label className="lead-field" htmlFor="activation-city">
            Ciudad
            <input id="activation-city" name="city" type="text" autoComplete="address-level2" />
            {errors.city && <span className="lead-field__error">{errors.city}</span>}
          </label>

          <label className="lead-field" htmlFor="activation-phone">
            Telefono
            <input id="activation-phone" name="phone" type="tel" autoComplete="tel" />
            {errors.phone && <span className="lead-field__error">{errors.phone}</span>}
          </label>

          {apiError && (
            <p className="lead-form__feedback lead-form__feedback--error" role="status">
              {apiError}
            </p>
          )}

          <button type="submit" className="pm-button pm-button--primary" disabled={sending}>
            {sending ? 'Conectando checkout...' : 'Continuar a pago'}
          </button>
        </form>
      </div>
    </div>
  )
}

