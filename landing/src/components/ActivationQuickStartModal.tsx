import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { createLandingActivation } from '../lib/publicApi.ts'
import { trackLandingEvent } from '../lib/analytics.ts'
import { getStoredUtm } from '../lib/utm.ts'

const quickActivationSchema = z.object({
  ownerName: z.string().min(2, 'Nombre requerido'),
  ownerEmail: z.string().email('Email invalido'),
  clubName: z.string().min(2, 'Club requerido'),
  city: z.string().min(2, 'Ciudad requerida'),
  phone: z.string().min(8, 'Telefono invalido'),
})

type QuickActivationData = z.infer<typeof quickActivationSchema>
type FieldErrors = Partial<Record<keyof QuickActivationData, string>>

type ActivationQuickStartModalProps = {
  open: boolean
  onClose: () => void
}

function extractOrderId(paymentUrl: string) {
  try {
    const url = new URL(paymentUrl, window.location.origin)
    return url.searchParams.get('orderId') ?? undefined
  } catch {
    return undefined
  }
}

export function ActivationQuickStartModal({ open, onClose }: ActivationQuickStartModalProps) {
  const [errors, setErrors] = useState<FieldErrors>({})
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const startedRef = useRef(false)

  const handleClose = useCallback((reason: 'backdrop' | 'button' | 'escape') => {
    trackLandingEvent('activation_modal_close', { reason })
    onClose()
  }, [onClose])

  useEffect(() => {
    if (!open) {
      setErrors({})
      setStatusMessage(null)
      setSending(false)
      startedRef.current = false
      return
    }

    trackLandingEvent('activation_modal_open', { location: 'landing' })

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose('escape')
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [open, handleClose])

  if (!open) return null

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrors({})
    setStatusMessage(null)

    const fd = new FormData(e.currentTarget)
    const raw = {
      ownerName: fd.get('ownerName') as string,
      ownerEmail: fd.get('ownerEmail') as string,
      clubName: fd.get('clubName') as string,
      city: fd.get('city') as string,
      phone: fd.get('phone') as string,
    }

    const result = quickActivationSchema.safeParse(raw)
    if (!result.success) {
      const fieldErrors: FieldErrors = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof QuickActivationData
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      const invalidFields = [...new Set(result.error.issues.map((issue) => String(issue.path[0] ?? 'unknown')))]
      trackLandingEvent('lead_form_submit_validation_error', {
        action: 'activation',
        invalidFields,
        location: 'activation_modal',
      })
      return
    }

    setSending(true)
    try {
      trackLandingEvent('activation_submit_attempt', { location: 'activation_modal' })
      const activation = await createLandingActivation({
        ownerName: result.data.ownerName,
        ownerEmail: result.data.ownerEmail,
        clubName: result.data.clubName,
        city: result.data.city,
        phone: result.data.phone,
        utm: getStoredUtm(),
      })

      if (activation.status === 201 && typeof activation.body.paymentUrl === 'string') {
        trackLandingEvent('activation_redirect_checkout', {
          location: 'activation_modal',
          orderId: extractOrderId(activation.body.paymentUrl),
        })
        window.location.href = activation.body.paymentUrl
        return
      }

      const apiMessage =
        typeof activation.body.message === 'string'
          ? activation.body.message
          : 'No fue posible iniciar el checkout por ahora.'
      setStatusMessage(apiMessage)
      trackLandingEvent('activation_submit_error', { location: 'activation_modal', status: activation.status })
    } catch {
      setStatusMessage('Error de conexion. Intenta de nuevo.')
      trackLandingEvent('activation_submit_error', { location: 'activation_modal', status: 'network_error' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="activation-modal" role="dialog" aria-modal="true" aria-labelledby="activation-modal-title">
      <button type="button" className="activation-modal__backdrop" onClick={() => handleClose('backdrop')} aria-label="Cerrar modal" />
      <div className="activation-modal__card">
        <div className="activation-modal__header">
          <h3 id="activation-modal-title">Activa tu evento por $750</h3>
          <button type="button" className="activation-modal__close" onClick={() => handleClose('button')} aria-label="Cerrar">
            x
          </button>
        </div>
        <p className="activation-modal__subtitle">
          Completa estos datos y te redirigimos al checkout seguro para finalizar el pago.
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
          <label className="activation-modal__field">
            <span>Nombre</span>
            <input name="ownerName" className="lead__input" placeholder="Tu nombre completo" />
            {errors.ownerName && <small className="lead__error">{errors.ownerName}</small>}
          </label>
          <label className="activation-modal__field">
            <span>Email</span>
            <input name="ownerEmail" type="email" className="lead__input" placeholder="correo@ejemplo.com" />
            {errors.ownerEmail && <small className="lead__error">{errors.ownerEmail}</small>}
          </label>
          <label className="activation-modal__field">
            <span>Club / Evento</span>
            <input name="clubName" className="lead__input" placeholder="Nombre del club o evento" />
            {errors.clubName && <small className="lead__error">{errors.clubName}</small>}
          </label>
          <label className="activation-modal__field">
            <span>Ciudad</span>
            <input name="city" className="lead__input" placeholder="Tu ciudad" />
            {errors.city && <small className="lead__error">{errors.city}</small>}
          </label>
          <label className="activation-modal__field">
            <span>Telefono</span>
            <input name="phone" type="tel" className="lead__input" placeholder="+52 ..." />
            {errors.phone && <small className="lead__error">{errors.phone}</small>}
          </label>
          {statusMessage && <p className="lead__error">{statusMessage}</p>}
          <button type="submit" className="btn btn--primary" disabled={sending}>
            {sending ? 'Conectando checkout...' : 'Ir a checkout'}
          </button>
        </form>
      </div>
    </div>
  )
}
