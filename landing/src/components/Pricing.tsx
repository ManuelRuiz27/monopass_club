import { useEffect, useState } from 'react'
import { getLandingPricing, type LandingPricing } from '../lib/publicApi.ts'
import { trackLandingEvent } from '../lib/analytics.ts'

const fallbackPricing: LandingPricing = {
  event_price: 750,
  base_price: 2999,
  pro_price: 5000,
  currency: 'MXN',
}

function formatPrice(value: number, currency: string) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

type PricingProps = {
  onActivateClick: () => void
}

export function Pricing({ onActivateClick }: PricingProps) {
  const [pricing, setPricing] = useState<LandingPricing>(fallbackPricing)

  useEffect(() => {
    let mounted = true
    getLandingPricing()
      .then((response) => {
        if (mounted) setPricing(response)
      })
      .catch(() => {})

    return () => {
      mounted = false
    }
  }, [])

  return (
    <section className="section-light" id="pricing">
      <div className="container content-stack">
        <h2 className="section-title">Elige tu modo de operacion</h2>
        <p className="section-subtitle">Pago automatico o mensual manual. Cancelacion flexible.</p>
        <div className="cards-grid cards-grid--three">
          <article className="panel-card">
            <span className="panel-tag">Evento individual</span>
            <h3>{formatPrice(pricing.event_price, pricing.currency)} / evento</h3>
            <p>Ideal para probar en tu siguiente evento.</p>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                trackLandingEvent('pricing_plan_selected', { plan: 'event' })
                trackLandingEvent('cta_activate_event_click', { location: 'pricing' })
                onActivateClick()
              }}
            >
              Activar 1 evento
            </button>
          </article>

          <article className="panel-card panel-card--highlight">
            <span className="panel-tag">Plan Club</span>
            <h3>{formatPrice(pricing.base_price, pricing.currency)} / mes</h3>
            <p>Incluye 4 eventos mensuales.</p>
            <a
              href="#formulario"
              className="btn btn--secondary"
              onClick={() => {
                trackLandingEvent('pricing_plan_selected', { plan: 'club' })
                trackLandingEvent('cta_schedule_demo_click', { location: 'pricing' })
              }}
            >
              Contratar Plan Club
            </a>
          </article>

          <article className="panel-card">
            <span className="panel-tag">Plan Pro</span>
            <h3>{formatPrice(pricing.pro_price, pricing.currency)} / mes</h3>
            <p>Incluye hasta 12 eventos mensuales.</p>
            <a
              href="#formulario"
              className="btn btn--secondary"
              onClick={() => {
                trackLandingEvent('pricing_plan_selected', { plan: 'pro' })
                trackLandingEvent('cta_schedule_demo_click', { location: 'pricing' })
              }}
            >
              Quiero el Plan Pro
            </a>
          </article>
        </div>
      </div>
    </section>
  )
}
