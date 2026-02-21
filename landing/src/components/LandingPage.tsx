import { useEffect } from 'react'
import { Hero } from './Hero.tsx'
import { ProblemSolution } from './ProblemSolution.tsx'
import { Steps } from './Steps.tsx'
import { DashboardPreview } from './DashboardPreview.tsx'
import { RoleBasedFlow } from './RoleBasedFlow.tsx'
import { Benefits } from './Benefits.tsx'
import { OfflineMode } from './OfflineMode.tsx'
import { SocialProof } from './SocialProof.tsx'
import { Pricing } from './Pricing.tsx'
import { Comparison } from './Comparison.tsx'
import { Faq } from './Faq.tsx'
import { FinalCta } from './FinalCta.tsx'
import { LeadForm } from './LeadForm.tsx'
import { RedirectionCard } from './RedirectionCard.tsx'
import { Footer } from './Footer.tsx'
import { StickyMobileCta } from './StickyMobileCta.tsx'
import { trackLandingEvent } from '../lib/analytics.ts'

const TRACKED_SECTION_IDS = [
  'hero',
  'role-flow',
  'beneficios',
  'pricing',
  'comparison',
  'faq',
  'cta-final',
  'formulario',
]

export function LandingPage() {
  const scrollToLeadForm = () => {
    document.getElementById('formulario')?.scrollIntoView({ behavior: 'smooth' })
  }

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

  return (
    <>
      <Hero onScheduleMeeting={scrollToLeadForm} />
      <ProblemSolution />
      <Steps />
      <DashboardPreview />
      <RoleBasedFlow />
      <Benefits />
      <OfflineMode />
      <SocialProof />
      <Pricing />
      <Comparison />
      <Faq />
      <FinalCta />
      <LeadForm />
      <RedirectionCard />
      <Footer />
      <StickyMobileCta onScheduleMeeting={scrollToLeadForm} />
    </>
  )
}
