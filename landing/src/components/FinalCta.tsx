import { trackLandingEvent } from '../lib/analytics.ts'

type FinalCtaProps = {
  onActivateClick: () => void
}

export function FinalCta({ onActivateClick }: FinalCtaProps) {
  return (
    <section className="section-dark" id="cta-final">
      <div className="container final-cta">
        <h2>Si quieres sold out real, deja el papel y domina la puerta</h2>
        <p>Activa hoy y conviertete en el club que cobra mejor, entra mas rapido y se ve mas premium.</p>
        <div className="final-cta__actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              trackLandingEvent('cta_activate_event_click', { location: 'final_cta' })
              onActivateClick()
            }}
            >
            ACTIVAR 1 EVENTO
          </button>
          <a
            href="#formulario"
            className="btn btn--secondary"
            onClick={() => trackLandingEvent('cta_schedule_demo_click', { location: 'final_cta' })}
          >
            HABLAR CON VENTAS
          </a>
        </div>
      </div>
    </section>
  )
}
