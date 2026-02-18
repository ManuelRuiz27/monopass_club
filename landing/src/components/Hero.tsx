import { useEffect, useRef } from 'react'
import { animateHero } from '../animations.ts'
import { trackLandingEvent } from '../lib/analytics.ts'

type HeroProps = {
  onActivateClick: () => void
}

export function Hero({ onActivateClick }: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    animateHero()
  }, [])

  return (
    <section className="hero section-dark" ref={sectionRef} id="hero">
      <div className="hero__inner container">
        <div className="hero__content">
          <span className="hero__badge">OPERACION NOCTURNA</span>
          <h1 className="hero__headline">
            Cobra mejor.
            <br />
            Controla cada acceso.
          </h1>
          <p className="hero__sub">
            Pass Monkey digitaliza tu puerta con QR dinamico, valida en segundos y te da visibilidad en tiempo real de
            lo que si entro.
          </p>
          <div className="hero__ctas">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                trackLandingEvent('cta_activate_event_click', { location: 'hero' })
                onActivateClick()
              }}
            >
              Activar 1 evento por $750
            </button>
            <a
              href="#pricing"
              className="btn btn--secondary"
              onClick={() => trackLandingEvent('cta_view_pricing_click', { location: 'hero' })}
            >
              Ver planes mensuales
            </a>
          </div>
          <ul className="hero__proofs">
            <li>Sin permanencia forzada</li>
            <li>Flujo para manager, RP y scanner</li>
            <li>Estatus de orden y provisioning post-checkout</li>
          </ul>
          <p className="hero__microcopy">Activo en minutos. Pago por evento o mensual.</p>
        </div>

        <div className="hero__media">
          <div className="hero__card">
            <div className="hero__status">VALIDADO</div>
            <p className="hero__card-title">Escaneo en segundos</p>
            <p className="hero__card-sub">Operacion clara en puerta con auditoria de accesos.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
