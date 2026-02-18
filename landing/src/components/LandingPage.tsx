import { useEffect, useState } from 'react'
import { Hero } from './Hero.tsx'
import { TheTape } from './TheTape.tsx'
import { HowItWorks } from './HowItWorks.tsx'
import { Benefits } from './Benefits.tsx'
import { Pricing } from './Pricing.tsx'
import { Comparison } from './Comparison.tsx'
import { RoleFit } from './RoleFit.tsx'
import { RevenueImpact } from './RevenueImpact.tsx'
import { SalesAssurance } from './SalesAssurance.tsx'
import { Faq } from './Faq.tsx'
import { FinalCta } from './FinalCta.tsx'
import { LeadForm } from './LeadForm.tsx'
import { Footer } from './Footer.tsx'
import { StickyMobileCta } from './StickyMobileCta.tsx'
import { ActivationQuickStartModal } from './ActivationQuickStartModal.tsx'
import { trackLandingEvent } from '../lib/analytics.ts'

const TRACKED_SECTION_IDS = [
  'hero',
  'tape',
  'como-funciona',
  'beneficios',
  'roles',
  'pricing',
  'comparativo',
  'roi',
  'respaldo',
  'faq',
  'cta-final',
  'formulario',
]

export function LandingPage() {
  const [activationModalOpen, setActivationModalOpen] = useState(false)

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
          if (!sectionId) continue
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

  return (
    <>
      <Hero onActivateClick={() => setActivationModalOpen(true)} />
      <TheTape />
      <HowItWorks />
      <Benefits />
      <RoleFit />
      <Pricing onActivateClick={() => setActivationModalOpen(true)} />
      <Comparison />
      <RevenueImpact onActivateClick={() => setActivationModalOpen(true)} />
      <SalesAssurance onActivateClick={() => setActivationModalOpen(true)} />
      <Faq />
      <FinalCta onActivateClick={() => setActivationModalOpen(true)} />
      <LeadForm />
      <Footer />
      <StickyMobileCta onActivateClick={() => setActivationModalOpen(true)} />
      <ActivationQuickStartModal open={activationModalOpen} onClose={() => setActivationModalOpen(false)} />
    </>
  )
}
