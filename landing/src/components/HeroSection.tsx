import { ArrowRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type HeroSectionProps = {
  eventPriceLabel: string
  onActivateEvent: () => void
  onViewPricing: () => void
}

export function HeroSection({ eventPriceLabel, onActivateEvent, onViewPricing }: HeroSectionProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [activeStep, setActiveStep] = useState(0)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setPrefersReducedMotion(media.matches)
    updatePreference()

    media.addEventListener('change', updatePreference)
    return () => media.removeEventListener('change', updatePreference)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const syncStep = () => {
      const duration = video.duration || 4.96
      const current = video.currentTime % duration
      const nextStep = current < 1.65 ? 0 : current < 3.45 ? 1 : 2
      setActiveStep((previous) => (previous === nextStep ? previous : nextStep))
    }

    const playVideo = () => {
      if (prefersReducedMotion) {
        video.pause()
        video.currentTime = 0
        setActiveStep(0)
        return
      }
      void video.play().catch(() => undefined)
    }

    video.addEventListener('loadedmetadata', syncStep)
    video.addEventListener('timeupdate', syncStep)
    playVideo()

    return () => {
      video.removeEventListener('loadedmetadata', syncStep)
      video.removeEventListener('timeupdate', syncStep)
    }
  }, [prefersReducedMotion])

  return (
    <section className="landing-section hero-section" id="hero" aria-labelledby="hero-title">
      <div className="landing-container hero-section__layout">
        <div className="hero-section__content" data-hero-content>
          <p className="hero-section__kicker" data-hero-kicker>
            Pass Monkey | Accesos para eventos
          </p>
          <p className="hero-section__badge">Operacion clara. Sin papel. Sin caos.</p>
          <h1 className="hero-section__title" id="hero-title">
            <span data-hero-title-line>Deja de imprimir boletos.</span>
          </h1>
          <p className="hero-section__subtitle" data-hero-subtitle>
            Controla accesos en tiempo real con QR dinamico y escaneo profesional en puerta.
          </p>
          <div className="hero-section__actions" data-hero-actions>
            <button type="button" className="pm-button pm-button--primary" onClick={onActivateEvent}>
              Activar 1 evento por {eventPriceLabel}
              <ArrowRight size={18} aria-hidden="true" />
            </button>
            <button type="button" className="pm-button pm-button--ghost" onClick={onViewPricing}>
              Ver planes mensuales
            </button>
          </div>
          <p className="hero-section__microcopy" data-hero-microcopy>
            Activo en minutos. Sin contratos. Pago por evento o mensual.
          </p>
          <div className="hero-section__ops" aria-label="Resultados operativos">
            <span>Menos filas y broncas</span>
            <span>Reduce clonaciones y reingresos</span>
            <span>Dashboard en tiempo real</span>
          </div>
          <p className="hero-section__segments" data-hero-segments>
            Hecho para clubes, bares con DJ, corporativos, bodas y eventos privados.
          </p>
        </div>

        <div className="hero-section__media" data-hero-media>
          <div className="hero-section__device-stage" data-hero-glow>
            <p className="hero-section__media-kicker">Escaneo real en puerta</p>
            <div className="hero-stage-layout">
              <figure className="hero-phone-render" aria-label="Flujo real en formato iPhone">
                <div className="hero-phone-render__viewport">
                  <video
                    ref={videoRef}
                    className="hero-phone-render__video"
                    poster="/assets/screenshots/scanner-mobile-home.png"
                    muted
                    loop
                    playsInline
                    autoPlay={!prefersReducedMotion}
                    preload="metadata"
                    aria-label="Video de escaneo de ticket demo en el scanner de Pass Monkey"
                  >
                    <source src="/assets/videos/scanner-demo.webm" type="video/webm" />
                    <source src="/assets/videos/scanner-demo.mp4" type="video/mp4" />
                  </video>
                </div>
              </figure>

              <div className="hero-flow" aria-label="Flujo real del scanner">
                <p className="hero-flow__kicker">Flujo de validacion</p>
                <div className="hero-flow-steps">
                  <article className={`hero-flow-step ${activeStep === 0 ? 'is-active' : ''}`} data-hero-flow-step>
                    <p>1. Abrir scanner</p>
                    <span>Staff abre la app y habilita validacion en puerta.</span>
                  </article>
                  <article className={`hero-flow-step ${activeStep === 1 ? 'is-active' : ''}`} data-hero-flow-step>
                    <p>2. Validacion exitosa</p>
                    <span>Lectura instantanea del QR y registro del acceso.</span>
                  </article>
                  <article className={`hero-flow-step ${activeStep === 2 ? 'is-active' : ''}`} data-hero-flow-step>
                    <p>3. Bloqueo reutilizado</p>
                    <span>Si intentan reingreso, el sistema lo detecta al momento.</span>
                  </article>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
