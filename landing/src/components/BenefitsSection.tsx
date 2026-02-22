import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

const benefits = [
  'Fugas de 5-10% suelen venir de papel, reingresos no controlados y cierres tardios.',
  'Cada acceso queda registrado para revisar diferencias sin discusiones en caja.',
  'El corte por colaborador de venta sale claro para pago y seguimiento.',
  'Menos tiempo en arqueo nocturno y mas foco en operar la siguiente fecha.',
]

const managerFlowSteps = ['Accesos validados', 'Corte por colaborador de venta', 'Seguimiento de diferencias']

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
    <section
      className="landing-section benefits-section"
      id="beneficio-economico"
      aria-labelledby="benefits-title"
      data-reveal
    >
      <div className="landing-container benefits-layout">
        <header className="section-header" data-reveal>
          <p className="section-header__eyebrow">Beneficio economico</p>
          <h2 className="section-header__title" id="benefits-title">
            Menos fugas en efectivo, mas tranquilidad al cerrar la noche.
          </h2>
          <p className="section-header__description">
            Cuando la puerta depende de papel y memoria, el margen de perdida puede crecer. Pass Monkey ordena acceso y
            corte para que cada fecha cierre con claridad.
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
            <p>Vista de control para managers y gerencia</p>
            <span>Corte y seguimiento en una sola vista</span>
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
            Tu equipo valida accesos y el sistema deja el rastro listo para revisar caja con respaldo.
          </p>
        </article>
      </div>
    </section>
  )
}
