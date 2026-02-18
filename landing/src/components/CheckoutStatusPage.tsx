import { useEffect, useMemo, useState } from 'react'
import { getLandingOrderStatus, type LandingOrderStatusResponse } from '../lib/publicApi.ts'
import { trackLandingEvent } from '../lib/analytics.ts'

type CheckoutStatusType = 'success' | 'pending' | 'failure'

type CheckoutStatusPageProps = {
  statusType: CheckoutStatusType
}

function resolveOrderIdFromUrl() {
  const params = new URLSearchParams(window.location.search)
  return params.get('orderId') ?? params.get('external_reference') ?? ''
}

function statusTitle(statusType: CheckoutStatusType) {
  if (statusType === 'success') return 'Pago aprobado'
  if (statusType === 'pending') return 'Pago pendiente'
  return 'Pago no completado'
}

function statusSubtitle(statusType: CheckoutStatusType) {
  if (statusType === 'success') return 'Estamos validando y provisionando tu acceso.'
  if (statusType === 'pending') return 'Tu pago esta en revision. Te notificaremos cuando cambie de estado.'
  return 'No se pudo completar el pago. Puedes intentar nuevamente.'
}

export function CheckoutStatusPage({ statusType }: CheckoutStatusPageProps) {
  const orderId = useMemo(() => resolveOrderIdFromUrl(), [])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [order, setOrder] = useState<LandingOrderStatusResponse | null>(null)

  useEffect(() => {
    trackLandingEvent(
      'checkout_status_view',
      { statusType, orderId: orderId || null },
      { dedupeKey: `checkout:view:${statusType}:${orderId || 'none'}` },
    )
  }, [orderId, statusType])

  useEffect(() => {
    if (!orderId) {
      setLoading(false)
      setError('No recibimos el identificador de orden.')
      trackLandingEvent(
        'checkout_status_error',
        { statusType, reason: 'missing_order_id' },
        { dedupeKey: `checkout:error:${statusType}:missing_order_id` },
      )
      return
    }

    let active = true
    getLandingOrderStatus(orderId)
      .then((response) => {
        if (!active) return
        setOrder(response)
        trackLandingEvent(
          'checkout_status_loaded',
          {
            statusType,
            orderId: response.orderId,
            paymentStatus: response.paymentStatus,
            provisioningStatus: response.provisioningStatus,
          },
          { dedupeKey: `checkout:loaded:${response.orderId}:${response.paymentStatus}:${response.provisioningStatus}` },
        )
      })
      .catch(() => {
        if (!active) return
        setError('No pudimos cargar el estado de tu orden.')
        trackLandingEvent(
          'checkout_status_error',
          { statusType, orderId, reason: 'status_fetch_failed' },
          { dedupeKey: `checkout:error:${statusType}:${orderId}:status_fetch_failed` },
        )
      })
      .finally(() => {
        if (!active) return
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [orderId])

  return (
    <main className="legal-page">
      <section className="section-dark">
        <div className="container content-stack">
          <a className="legal-back" href="/">
            Volver a landing
          </a>
          <h1 className="section-title">{statusTitle(statusType)}</h1>
          <p className="section-subtitle">{statusSubtitle(statusType)}</p>

          {loading && <p className="section-subtitle">Cargando estado...</p>}
          {error && <p className="lead__error">{error}</p>}

          {order && (
            <div className="cards-grid">
              <article className="panel-card">
                <h3>Orden</h3>
                <p>{order.orderId}</p>
              </article>
              <article className="panel-card">
                <h3>Pago</h3>
                <p>{order.paymentStatus}</p>
              </article>
              <article className="panel-card">
                <h3>Provisioning</h3>
                <p>{order.provisioningStatus}</p>
              </article>
              <article className="panel-card">
                <h3>Monto</h3>
                <p>
                  {new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: order.currency,
                    maximumFractionDigits: 0,
                  }).format(order.amount)}
                </p>
              </article>
              <article className="panel-card">
                <h3>Email credenciales</h3>
                <p>{order.credentialsEmailSentAt ? 'Enviado' : 'Pendiente'}</p>
                {order.credentialsEmailError && <p className="lead__error">{order.credentialsEmailError}</p>}
              </article>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
