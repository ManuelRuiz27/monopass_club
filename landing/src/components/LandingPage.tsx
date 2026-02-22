import { useCallback, useEffect, useRef, useState } from 'react'
import { HeroSection } from './HeroSection.tsx'
import { HowItWorksSection } from './HowItWorksSection.tsx'
import { BenefitsSection } from './BenefitsSection.tsx'
import { OfflineModeSection } from './OfflineModeSection.tsx'
import { SocialProofSection } from './SocialProofSection.tsx'
import { PricingSection } from './PricingSection.tsx'
import { FaqSection } from './FaqSection.tsx'
import { MonoticketsHandoffSection } from './MonoticketsHandoffSection.tsx'
import { FinalCtaSection } from './FinalCtaSection.tsx'
import { StickyMobileCta } from './StickyMobileCta.tsx'
import { FooterSection } from './FooterSection.tsx'
import { ActivationModal } from './ActivationModal.tsx'
import { trackLandingEvent } from '../lib/analytics.ts'
import { initHeroTimeline, initMobileClubEffects, initScrollReveals } from '../animations.ts'
import type { LandingPricing } from '../lib/publicApi.ts'

type MonthlyPlan = 'club' | 'pro' | null

const TRACKED_SECTION_IDS = [
  'hero',
  'beneficio-economico',
  'como-funciona',
  'modo-offline',
  'prueba-social',
  'pricing',
  'faq',
  'handoff-monotickets',
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
  const [eventPriceLabel, setEventPriceLabel] = useState('$700')
  const rootRef = useRef<HTMLDivElement>(null)

  const handleOpenActivation = useCallback((location: string) => {
    trackLandingEvent('cta_activate_event_click', { location })
    setActivationOpen(true)
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
    const cleanupMobileClub = initMobileClubEffects(root)

    return () => {
      cleanupHero()
      cleanupReveals()
      cleanupMobileClub()
    }
  }, [])

  return (
    <div ref={rootRef}>
      <HeroSection
        eventPriceLabel={eventPriceLabel}
        onActivateEvent={() => handleOpenActivation('hero')}
        onScheduleDemo={() => handleScheduleDemo('hero')}
      />
      <BenefitsSection />
      <HowItWorksSection />
      <OfflineModeSection />
      <SocialProofSection />
      <PricingSection
        onActivateEvent={() => handleOpenActivation('pricing')}
        onSelectMonthlyPlan={handleSelectMonthlyPlan}
        onPricingResolved={handlePricingResolved}
      />
      <FaqSection />
      <MonoticketsHandoffSection />
      <FinalCtaSection
        selectedPlan={selectedPlan}
        eventPriceLabel={eventPriceLabel}
        onActivateEvent={() => handleOpenActivation('cta_final')}
      />
      <FooterSection />
      <StickyMobileCta
        eventPriceLabel={eventPriceLabel}
        hidden={activationOpen}
        onScheduleDemo={() => handleScheduleDemo('sticky_mobile')}
        onActivateEvent={() => handleOpenActivation('sticky_mobile')}
      />

      <ActivationModal open={activationOpen} eventPriceLabel={eventPriceLabel} onClose={() => setActivationOpen(false)} />
    </div>
  )
}

