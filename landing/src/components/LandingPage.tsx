import { useCallback, useEffect, useRef, useState } from 'react'
import { HeroSection } from './HeroSection.tsx'
import { ProblemSolution } from './ProblemSolution.tsx'
import { HowItWorksSection } from './HowItWorksSection.tsx'
import { RevenueImpact } from './RevenueImpact.tsx'
import { OfflineMode } from './OfflineMode.tsx'
import { PricingSection } from './PricingSection.tsx'
import { ComparisonSection } from './ComparisonSection.tsx'
import { FaqSection } from './FaqSection.tsx'
import { FinalCtaSection } from './FinalCtaSection.tsx'
import { FooterSection } from './FooterSection.tsx'
import { ActivationModal } from './ActivationModal.tsx'
import { trackLandingEvent } from '../lib/analytics.ts'
import { initHeroTimeline, initScrollReveals } from '../animations.ts'
import type { LandingPricing } from '../lib/publicApi.ts'

type MonthlyPlan = 'club' | 'pro' | null

const TRACKED_SECTION_IDS = [
  'hero',
  'problema',
  'como-funciona',
  'demo-en-vivo',
  'roi',
  'offline',
  'pricing',
  'comparativo',
  'faq',
  'cta-final',
  'footer',
]

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

function scrollToSection(sectionId: string) {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function LandingPage() {
  const [activationOpen, setActivationOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<MonthlyPlan>(null)
  const [eventPriceLabel, setEventPriceLabel] = useState('$750')
  const rootRef = useRef<HTMLDivElement>(null)

  const handleOpenActivation = useCallback((location: string) => {
    trackLandingEvent('cta_activate_event_click', { location })
    setActivationOpen(true)
  }, [])

  const handleViewPricing = useCallback(() => {
    trackLandingEvent('cta_view_pricing_click', { location: 'hero' })
    scrollToSection('pricing')
  }, [])

  const handleScheduleDemo = useCallback((location: string) => {
    trackLandingEvent('cta_schedule_demo_click', { location })
    scrollToSection('cta-final')
  }, [])

  const handleSelectMonthlyPlan = useCallback((plan: 'club' | 'pro') => {
    setSelectedPlan(plan)
    trackLandingEvent('pricing_plan_selected', { plan })
    trackLandingEvent('cta_schedule_demo_click', { location: `pricing_${plan}` })
    scrollToSection('cta-final')
  }, [])

  const handlePricingResolved = useCallback((pricing: LandingPricing) => {
    setEventPriceLabel(formatCurrency(pricing.event_price, pricing.currency))
  }, [])

  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      for (const sectionId of TRACKED_SECTION_IDS) {
        trackLandingEvent('landing_section_view', { sectionId }, { dedupeKey: `section:${sectionId}` })
      }
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const sectionId = entry.target.id
          trackLandingEvent('landing_section_view', { sectionId }, { dedupeKey: `section:${sectionId}` })
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.35 },
    )

    for (const sectionId of TRACKED_SECTION_IDS) {
      const node = document.getElementById(sectionId)
      if (node) observer.observe(node)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    // Shared animation entrypoint: hero timeline + reveal motions with reduced-motion guards.
    const cleanupHero = initHeroTimeline(root)
    const cleanupReveals = initScrollReveals(root)

    return () => {
      cleanupHero()
      cleanupReveals()
    }
  }, [])

  return (
    <div ref={rootRef}>
      <HeroSection
        eventPriceLabel={eventPriceLabel}
        onActivateEvent={() => handleOpenActivation('hero')}
        onScheduleDemo={() => handleScheduleDemo('hero')}
        onViewPricing={handleViewPricing}
      />
      <ProblemSolution />
      <HowItWorksSection />
      <section className="landing-section landing-demo-focus" id="demo-en-vivo" aria-labelledby="demo-focus-title" data-reveal>
        <div className="landing-container landing-demo-focus__layout">
          <div className="landing-demo-focus__copy">
            <p className="landing-demo-focus__eyebrow">Demo en vivo</p>
            <h2 className="landing-demo-focus__title" id="demo-focus-title">
              Haz la prueba completa: emite un acceso y validalo en el scanner.
            </h2>
            <p className="landing-demo-focus__description">
              Antes de dejar tus datos, ¡Prueba la experiencia de generar accesos y escanearlos en tiempo real!
            </p>
            <ul className="landing-demo-focus__bullets" aria-label="Qué puedes probar en la demo">
              <li>Emitir ticket demo con QR funcional</li>
              <li>Escanear y validar el acceso en local</li>
              <li>Ver bloqueo de reuso del boleto</li>
            </ul>
            <div className="landing-demo-focus__actions">
              <a href="/demo" className="pm-button pm-button--primary">
                Probar demo interactiva
              </a>
              <button
                type="button"
                className="pm-button pm-button--secondary"
                onClick={() => handleScheduleDemo('demo_section')}
              >
                Agendar demo guiada
              </button>
            </div>
          </div>

          <div className="landing-demo-focus__preview" aria-label="Vista previa de la demo">
            <p className="landing-demo-focus__preview-label">Vista previa (no interactiva)</p>
            <div className="landing-demo-focus__preview-shell">
              <img
                src="/assets/screenshots/scanner-mobile-home.png"
                alt="Preview del scanner movil de Pass Monkey"
                className="landing-demo-focus__preview-image"
              />
              <div className="landing-demo-focus__preview-note" aria-hidden="true">
                <span>1. Emites</span>
                <span>2. Escaneas</span>
                <span>3. Validas</span>
              </div>
            </div>
            <p className="landing-demo-focus__preview-caption">
              Los botones de arriba son el acceso real. Esta tarjeta solo muestra la interfaz.
            </p>
          </div>
        </div>
      </section>
      <RevenueImpact onActivateClick={() => handleOpenActivation('roi')} />
      <OfflineMode />
      <PricingSection
        onActivateEvent={() => handleOpenActivation('pricing')}
        onSelectMonthlyPlan={handleSelectMonthlyPlan}
        onPricingResolved={handlePricingResolved}
      />
      <ComparisonSection />
      <FaqSection />
      <FinalCtaSection
        selectedPlan={selectedPlan}
        eventPriceLabel={eventPriceLabel}
        onActivateEvent={() => handleOpenActivation('cta_final')}
      />
      <FooterSection />

      <ActivationModal open={activationOpen} eventPriceLabel={eventPriceLabel} onClose={() => setActivationOpen(false)} />
    </div>
  )
}
