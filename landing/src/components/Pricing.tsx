import { useEffect, useState } from 'react'
import { getLandingPricing, type LandingPricing } from '../lib/publicApi.ts'
import { trackLandingEvent } from '../lib/analytics.ts'

const fallbackPricing: LandingPricing = {
  event_price: 700,
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
  onScheduleMeeting?: () => void
}

export function Pricing({ onScheduleMeeting }: PricingProps = {}) {
  const [pricing, setPricing] = useState<LandingPricing>(fallbackPricing)
  const [selectedPlan, setSelectedPlan] = useState<'event' | 'club' | 'pro' | null>('event')

  useEffect(() => {
    let mounted = true
    getLandingPricing()
      .then((response) => {
        if (mounted) setPricing(response)
      })
      .catch(() => { })

    return () => {
      mounted = false
    }
  }, [])

  return (
    <section className="section-light" id="pricing">
      <div className="container content-stack">
        <h2 className="section-title">Precio de introducción</h2>
        <p className="section-subtitle">Después: Modelo por evento o migración a plan mensual.</p>
        <div className="pricing-grid">
          <article className={`panel-card pricing-card panel-card--highlight${selectedPlan === 'event' ? ' pricing-card--selected' : ''}`}>
            <span className="panel-tag">NUEVO CLUB</span>
            <h3>{formatPrice(pricing.event_price, pricing.currency)} / primer evento</h3>
            <p><strong>Garantía "Double-Blind":</strong> Si a las 4 AM nuestros números no cuadran con tu papel, te devolvemos tu dinero.</p>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                setSelectedPlan('event')
                trackLandingEvent('pricing_plan_selected', { plan: 'event' })
                trackLandingEvent('cta_schedule_demo_click', { location: 'pricing_event' })
                if (onScheduleMeeting) {
                  onScheduleMeeting()
                  return
                }
                document.getElementById('formulario')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              AGENDAR REUNION
            </button>
            <div className="pricing-card__burst" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          </article>

          <article className={`panel-card pricing-card${selectedPlan === 'club' ? ' pricing-card--selected' : ''}`}>
            <span className="pricing-card__badge">MENSUAL</span>
            <span className="panel-tag">PLAN CLUB</span>
            <h3>{formatPrice(pricing.base_price, pricing.currency)} / mes</h3>
            <p>Para clubs con agenda regular. 4 eventos al mes con soporte incluido.</p>
            <a
              href="#formulario"
              className="btn btn--primary"
              onClick={() => {
                setSelectedPlan('club')
                trackLandingEvent('pricing_plan_selected', { plan: 'club' })
                trackLandingEvent('cta_schedule_demo_click', { location: 'pricing' })
              }}
            >
              AGENDAR REUNION
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
            <span className="panel-tag">PLAN PRO</span>
            <h3>{formatPrice(pricing.pro_price, pricing.currency)} / mes</h3>
            <p>Operación a escala. Hasta 12 eventos mensuales para temporadas fuertes.</p>
            <a
              href="#formulario"
              className="btn btn--secondary"
              onClick={() => {
                setSelectedPlan('pro')
                trackLandingEvent('pricing_plan_selected', { plan: 'pro' })
                trackLandingEvent('cta_schedule_demo_click', { location: 'pricing' })
              }}
            >
              AGENDAR REUNION
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
