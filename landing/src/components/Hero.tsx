import { type CSSProperties, type PointerEvent, useEffect, useRef, useState } from 'react'
import { animateHero } from '../animations.ts'
import { trackLandingEvent } from '../lib/analytics.ts'

type HeroProps = {
  onActivateClick: () => void
}

export function Hero({ onActivateClick }: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const [sceneMotion, setSceneMotion] = useState({ x: 0, y: 0 })

  useEffect(() => {
    animateHero()
  }, [])

  function handleScenePointerMove(e: PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    setSceneMotion({
      x: px * 12,
      y: py * 12,
    })
  }

  const sceneStyle = {
    '--mono-rotate-y': `${sceneMotion.x.toFixed(2)}deg`,
    '--mono-rotate-x': `${(-sceneMotion.y).toFixed(2)}deg`,
    '--mono-shift-x': `${(sceneMotion.x * 1.4).toFixed(2)}px`,
    '--mono-shift-y': `${(sceneMotion.y * 1.2).toFixed(2)}px`,
    '--mono-glow-size': `${(18 + Math.abs(sceneMotion.x) * 1.8 + Math.abs(sceneMotion.y) * 1.4).toFixed(2)}px`,
  } as CSSProperties

  return (
    <section className="hero section-dark" ref={sectionRef} id="hero">
      <div className="hero__noise" aria-hidden="true" />
      <div className="hero__inner container">
        <div className="hero__content">
          <span className="hero__badge">HECHO PARA GERENTES DE ANTRO</span>
          <h1 className="hero__headline" data-text="DEJA EL BOLETO IMPRESO. COBRA CON CONTROL.">
            DEJA EL BOLETO IMPRESO.
            <br />
            COBRA CON CONTROL.
          </h1>
          <p className="hero__sub">
            Cuando sigues con listas de RP y papel, pierdes tiempo, dinero y autoridad en puerta. Pass Monkey te pone
            venta, validacion y control en una sola experiencia hype.
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
              ACTIVAR NOCHE ($750)
            </button>
            <a
              href="#formulario"
              className="btn btn--secondary"
              onClick={() => trackLandingEvent('cta_schedule_demo_click', { location: 'hero' })}
            >
              QUIERO LLAMADA DE VENTAS
            </a>
          </div>
          <ul className="hero__proofs">
            <li>Tu flyer se convierte en acceso oficial personalizado.</li>
            <li>Cada escaneo se registra: menos fuga, mas caja protegida.</li>
            <li>RP, manager y staff operan sincronizados en hora pico.</li>
          </ul>
          <a
            href="#formulario"
            className="hero__sales-bridge"
            onClick={() => trackLandingEvent('cta_schedule_demo_click', { location: 'hero_bridge' })}
          >
            CONCEPTO VIP: TU FLYER VIVE EN CADA ACCESO.
            <span>IR A VENTAS AHORA</span>
          </a>
          <p className="hero__microcopy">Sin hojas sueltas. Sin conteos manuales. Con una puerta que vende mejor.</p>
        </div>

        <div className="hero__media">
          <div
            className="hero__scene"
            style={sceneStyle}
            onPointerMove={handleScenePointerMove}
            onPointerLeave={() => setSceneMotion({ x: 0, y: 0 })}
          >
            <span className="hero__scene-light" aria-hidden="true" />
            <img
              src="/assets/logos/pass-monkey-neon-letters.png"
              alt="Pass Monkey"
              className="hero__wordmark"
            />
            <div className="hero__lockup-badge" aria-hidden="true">
              <img src="/assets/logos/pass-monkey-lockup-3d.png" alt="" />
            </div>
            <div className="hero__flyer-card">
              <p className="hero__flyer-kicker">NUEVO PLUS</p>
              <h3>Tu flyer = tu acceso personalizado</h3>
              <p>Haz que cada QR se vea como parte oficial de tu evento.</p>
              <div className="hero__flyer-meta">
                <span>PREVENTA ACTIVA</span>
                <span>FILA VIP FAST-LANE</span>
              </div>
            </div>
            <div className="hero__queue">
              <p>SAB 11:00 PM</p>
              <strong>430 ACCESOS PRE-REGISTRADOS</strong>
            </div>
            <div className="hero__mono-3d" aria-hidden="true">
              <span className="hero__mono-ring" />
              <div className="hero__mono-core">
                <img src="/assets/logos/mono-logo.png" alt="" className="hero__mono-face hero__mono-face--front" />
                <img src="/assets/logos/mono-logo.png" alt="" className="hero__mono-face hero__mono-face--back" />
                <span className="hero__mono-edge" />
              </div>
              <span className="hero__mono-laser" />
            </div>
            <div className="hero__status">MOST WANTED NIGHT TOOL</div>
          </div>
        </div>
      </div>
    </section>
  )
}
