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
  const [selectedPlan, setSelectedPlan] = useState<'event' | 'club' | 'pro' | null>('club')

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
        <img
          src="/assets/logos/pass-monkey-neon-letters.png"
          alt=""
          aria-hidden="true"
          className="pricing__mark"
        />
        <h2 className="section-title">Elige tu nivel de noche</h2>
        <p className="section-subtitle">Empieza hoy y sube de nivel cuando tu agenda se ponga en modo sold out.</p>
        <div className="pricing-grid">
          <article className={`panel-card pricing-card${selectedPlan === 'event' ? ' pricing-card--selected' : ''}`}>
            <span className="panel-tag">GUEST LIST</span>
            <h3>{formatPrice(pricing.event_price, pricing.currency)} / evento</h3>
            <p>Entrada directa para activar tu siguiente fecha sin riesgo.</p>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                setSelectedPlan('event')
                trackLandingEvent('pricing_plan_selected', { plan: 'event' })
                trackLandingEvent('cta_activate_event_click', { location: 'pricing' })
                onActivateClick()
              }}
            >
              ACTIVAR AHORA
            </button>
            <div className="pricing-card__burst" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          </article>

          <article className={`panel-card pricing-card panel-card--highlight${selectedPlan === 'club' ? ' pricing-card--selected' : ''}`}>
            <span className="pricing-card__badge">MOST WANTED</span>
            <span className="panel-tag">VIP TABLE</span>
            <h3>{formatPrice(pricing.base_price, pricing.currency)} / mes</h3>
            <p>4 eventos al mes con experiencia premium en puerta.</p>
            <a
              href="#formulario"
              className="btn btn--primary"
              onClick={() => {
                setSelectedPlan('club')
                trackLandingEvent('pricing_plan_selected', { plan: 'club' })
                trackLandingEvent('cta_schedule_demo_click', { location: 'pricing' })
              }}
            >
              RESERVAR VIP TABLE
            </a>
            <div className="pricing-card__burst" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          </article>

          <article className={`panel-card pricing-card${selectedPlan === 'pro' ? ' pricing-card--selected' : ''}`}>
            <span className="panel-tag">ALL ACCESS</span>
            <h3>{formatPrice(pricing.pro_price, pricing.currency)} / mes</h3>
            <p>Hasta 12 eventos mensuales para temporadas de alta demanda.</p>
            <a
              href="#formulario"
              className="btn btn--secondary"
              onClick={() => {
                setSelectedPlan('pro')
                trackLandingEvent('pricing_plan_selected', { plan: 'pro' })
                trackLandingEvent('cta_schedule_demo_click', { location: 'pricing' })
              }}
            >
              QUIERO ALL ACCESS
            </a>
            <div className="pricing-card__burst" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}
