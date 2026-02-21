import { trackLandingEvent } from '../lib/analytics.ts'

export function FinalCta() {
  return (
    <section className="section-dark" id="cta-final">
      <div className="container final-cta">
        <h2>Controla tu próximo evento sin papel.</h2>
        <div className="final-cta__actions">
          <a
            href="#formulario"
            className="btn btn--primary"
            onClick={() => {
              trackLandingEvent('cta_schedule_demo_click', { location: 'final_cta' })
            }}
          >
            Agenda tu Demo Ahora
          </a>
          <a
            href="#pricing"
            className="btn btn--secondary"
            onClick={() => trackLandingEvent('cta_view_pricing_click', { location: 'final_cta' })}
          >
            VER PROPUESTA
          </a>
        </div>
      </div>
    </section>
  )
}
