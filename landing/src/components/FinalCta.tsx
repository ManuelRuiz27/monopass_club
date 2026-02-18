import { trackLandingEvent } from '../lib/analytics.ts'

type FinalCtaProps = {
  onActivateClick: () => void
}

export function FinalCta({ onActivateClick }: FinalCtaProps) {
  return (
    <section className="section-dark" id="cta-final">
      <div className="container final-cta">
        <h2>Tu siguiente evento puede operar sin fugas ni caos en puerta</h2>
        <p>Empieza por $750 o escala a plan mensual cuando ya tengas flujo recurrente.</p>
        <div className="final-cta__actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              trackLandingEvent('cta_activate_event_click', { location: 'final_cta' })
              onActivateClick()
            }}
          >
            Activar 1 evento
          </button>
          <a
            href="#formulario"
            className="btn btn--secondary"
            onClick={() => trackLandingEvent('cta_schedule_demo_click', { location: 'final_cta' })}
          >
            Agendar demo
          </a>
        </div>
      </div>
    </section>
  )
}
