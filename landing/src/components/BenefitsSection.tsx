import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

const benefits = [
  'Menos filas y broncas en la entrada.',
  'Reduce clonaciones y reingresos no autorizados.',
  'Escaneo rapido con auditoria operativa.',
  'Dashboard en tiempo real para decisiones en piso.',
]

const managerFlowSteps = ['Crear evento', 'Cargar flyer', 'Generar accesos']

export function BenefitsSection() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setPrefersReducedMotion(media.matches)
    updatePreference()

    media.addEventListener('change', updatePreference)
    return () => media.removeEventListener('change', updatePreference)
  }, [])

  return (
    <section className="landing-section benefits-section" id="beneficios" aria-labelledby="benefits-title" data-reveal>
      <div className="landing-container benefits-layout">
        <header className="section-header" data-reveal>
          <p className="section-header__eyebrow">Beneficios operativos</p>
          <h2 className="section-header__title" id="benefits-title">
            Menos caos en puerta. Mas control en cada acceso.
          </h2>
          <p className="section-header__description">
            Pass Monkey esta pensado para operaciones nocturnas exigentes: club lleno, flujo constante y cero margen de
            error.
          </p>
        </header>

        <ul className="benefits-list" aria-label="Beneficios clave">
          {benefits.map((benefit) => (
            <li className="benefits-list__item" key={benefit} data-reveal>
              <CheckCircle2 size={20} aria-hidden="true" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        <article className="benefits-section__proof" data-reveal>
          <div className="benefits-section__proof-head">
            <p>Vista operativa en produccion</p>
            <span>Flujo manager en desktop</span>
          </div>

          {prefersReducedMotion ? (
            <img
              className="benefits-section__proof-media"
              src="/assets/screenshots/manager-dashboard.png"
              alt="Vista desktop del panel manager"
              loading="lazy"
            />
          ) : (
            <video
              className="benefits-section__proof-media"
              poster="/assets/screenshots/manager-dashboard.png"
              muted
              loop
              autoPlay
              playsInline
              preload="metadata"
              aria-label="Demo desktop de manager creando evento, cargando flyer y generando accesos"
            >
              <source src="/assets/videos/manager-demo.webm" type="video/webm" />
              <source src="/assets/videos/manager-demo.mp4" type="video/mp4" />
            </video>
          )}

          <div className="benefits-section__proof-flow" aria-label="Flujo de operacion del manager">
            {managerFlowSteps.map((step) => (
              <span key={step}>{step}</span>
            ))}
          </div>

          <p className="benefits-section__proof-note">
            El manager configura evento, carga flyer y genera accesos digitales listos para compartir.
          </p>
        </article>
      </div>
    </section>
  )
}
