import { useCallback, useEffect, useRef, useState } from 'react'
import { HeroSection } from './HeroSection.tsx'
import { HowItWorksSection } from './HowItWorksSection.tsx'
import { BenefitsSection } from './BenefitsSection.tsx'
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

const TRACKED_SECTION_IDS = ['hero', 'como-funciona', 'beneficios', 'pricing', 'comparativo', 'faq', 'cta-final', 'footer']

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
        onViewPricing={handleViewPricing}
      />
      <HowItWorksSection />
      <BenefitsSection />
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

