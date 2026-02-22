import { useEffect, useMemo, useState } from 'react'
import { CircleAlert, LoaderCircle } from 'lucide-react'
import { getLandingPricing, type LandingPricing } from '../lib/publicApi.ts'

type MonthlyPlan = 'club' | 'pro'

type PricingSectionProps = {
  onActivateEvent: () => void
  onSelectMonthlyPlan: (plan: MonthlyPlan) => void
  onPricingResolved?: (pricing: LandingPricing) => void
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

export function PricingSection({ onActivateEvent, onSelectMonthlyPlan, onPricingResolved }: PricingSectionProps) {
  const [pricing, setPricing] = useState<LandingPricing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    // Pricing comes from API so commercial can update montos without redeploy.
    getLandingPricing()
      .then((response) => {
        if (!active) return
        setPricing(response)
        onPricingResolved?.(response)
      })
      .catch(() => {
        if (!active) return
        setError('No pudimos actualizar precios en este momento.')
      })
      .finally(() => {
        if (!active) return
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [onPricingResolved])

  const values = useMemo(() => {
    const currency = pricing?.currency ?? 'MXN'
    return {
      eventPrice: pricing ? formatCurrency(pricing.event_price, currency) : '--',
      clubPrice: pricing ? formatCurrency(pricing.base_price, currency) : '--',
      proPrice: pricing ? formatCurrency(pricing.pro_price, currency) : '--',
    }
  }, [pricing])

  return (
    <section className="landing-section" id="pricing" aria-labelledby="pricing-title" data-reveal>
      <div className="landing-container">
        <header className="section-header" data-reveal>
          <p className="section-header__eyebrow">Producto y planes</p>
          <h2 className="section-header__title" id="pricing-title">
            Elige tu ritmo: prueba pagada o operacion mensual.
          </h2>
          <p className="section-header__description">
            Pago automatico o mensual manual. Cancelacion flexible.
          </p>
        </header>

        {loading && (
          <p className="section-feedback" role="status" aria-live="polite">
            <LoaderCircle size={16} className="spin" aria-hidden="true" />
            Cargando precios...
          </p>
        )}

        {error && !pricing && (
          <p className="section-feedback section-feedback--error" role="status" aria-live="polite">
            <CircleAlert size={16} aria-hidden="true" />
            {error}
          </p>
        )}

        <div className="pricing-grid" data-reveal>
          <article className="pricing-card pricing-card--featured">
            <p className="pricing-card__name">Evento individual</p>
            <p className="pricing-card__price">{values.eventPrice} / evento</p>
            <p className="pricing-card__description">Ideal para probar la operacion completa en una sola fecha.</p>
            <ul className="pricing-card__features">
              <li>1 evento activo</li>
              <li>QR dinamico y validacion en puerta</li>
              <li>Reporte operativo basico</li>
            </ul>
            <button type="button" className="pm-button pm-button--primary" onClick={onActivateEvent}>
              Activar 1 evento
            </button>
          </article>

          <article className="pricing-card pricing-card--club">
            <p className="pricing-card__badge">Mas elegido</p>
            <p className="pricing-card__name">Plan Club</p>
            <p className="pricing-card__price">{values.clubPrice} / mes</p>
            <p className="pricing-card__description">Incluye 4 eventos al mes para clubes con agenda regular.</p>
            <ul className="pricing-card__features">
              <li>Hasta 4 eventos por mes</li>
              <li>Control de reingresos y trazabilidad</li>
              <li>Soporte operativo prioritario</li>
            </ul>
            <button type="button" className="pm-button pm-button--secondary" onClick={() => onSelectMonthlyPlan('club')}>
              Contratar Plan Club
            </button>
          </article>

          <article className="pricing-card">
            <p className="pricing-card__name">Plan Pro</p>
            <p className="pricing-card__price">~{values.proPrice} / mes</p>
            <p className="pricing-card__description">Incluye 12 eventos al mes para temporadas de alta demanda.</p>
            <ul className="pricing-card__features">
              <li>Hasta 12 eventos por mes</li>
              <li>Flujos para multiples accesos por noche</li>
              <li>Acompanamiento para escalamiento</li>
            </ul>
            <button type="button" className="pm-button pm-button--secondary" onClick={() => onSelectMonthlyPlan('pro')}>
              Quiero el Plan Pro
            </button>
          </article>
        </div>

        {error && pricing && (
          <p className="section-feedback" role="status" aria-live="polite">
            <CircleAlert size={16} aria-hidden="true" />
            {error}
          </p>
        )}
      </div>
    </section>
  )
}

