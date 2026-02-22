import { useEffect, useRef, type MouseEvent } from 'react'
import gsap from 'gsap'
import { ArrowRight, Scan } from 'lucide-react'
import { animateHero } from '../animations'
import { HeroScanExperience } from './HeroScanExperience'
import { trackLandingEvent } from '../lib/analytics.ts'

export const Hero = ({ onScheduleMeeting }: { onScheduleMeeting: () => void }) => {
  const containerRef = useRef<HTMLElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const visualRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      animateHero()
    }, containerRef)

    return () => ctx.revert()
  }, [])

  const scrollToPricing = (event: MouseEvent) => {
    event.preventDefault()
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <section className="hero hero--massive" id="hero" ref={containerRef}>
        <div className="hero__grid" />
        <div className="hero__noise" />

        <div className="hero__nav container">
          <div className="logo">
            <Scan size={24} />
            MONOPASS
          </div>
        </div>

        <div className="hero__inner container">
          <div className="hero__content">
            <span className="hero__badge">SISTEMA DE GESTION DE ACCESOS</span>
            <h1 className="hero__headline" ref={headlineRef}>
              <span className="hero-word hero-word--base">Controla tus accesos.</span>
              <span className="hero-word hero-word--acid">Elimina pérdidas.</span>
              <span className="hero-word hero-word--base">Olvídate del papel.</span>
            </h1>

            <p className="hero__subheadline">
              Pass Monkey reemplaza los talonarios físicos y organiza el control de colaboradores de venta, cortes y
              accesos en tiempo real — sin afectar tu flujo en efectivo.
            </p>

            <div className="hero__actions">
              <button
                className="btn btn--primary"
                onClick={() => {
                  trackLandingEvent('cta_schedule_demo_click', { location: 'hero' })
                  onScheduleMeeting()
                }}
              >
                Agenda tu Demo
                <ArrowRight size={20} />
              </button>
              <a href="#pricing" className="btn btn--secondary" onClick={scrollToPricing}>
                Prueba tu Primer Evento por $700
              </a>
            </div>

            <div className="hero__microcopy">
              <span>? Sin contratos forzosos</span>
              <span>? Activo en minutos</span>
              <span>? Control por staff y colaborador de venta</span>
            </div>
          </div>

          <div className="hero__visual" ref={visualRef}>
            <HeroScanExperience />
          </div>
        </div>
      </section>
    </>
  )
}
