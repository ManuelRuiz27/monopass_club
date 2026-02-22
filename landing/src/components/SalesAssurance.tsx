import { trackLandingEvent } from '../lib/analytics.ts'

type SalesAssuranceProps = {
  onActivateClick: () => void
}

const assurances = [
  'Activacion guiada para que no pierdas tiempo antes de abrir puertas.',
  'Sin amarrarte: pagas por evento o mensual segun tu ritmo.',
  'Soporte real para manager, colaborador de venta y staff en la implementacion.',
  'Estatus de orden claro para que tu equipo se mueva sin dudas.',
]

export function SalesAssurance({ onActivateClick }: SalesAssuranceProps) {
  return (
    <section className="section-dark" id="respaldo">
      <div className="container content-stack">
        <h2 className="section-title">Entras rapido, operas seguro, vendes mejor</h2>
        <div className="assurance-box">
          <div className="assurance-box__content">
            <p className="section-subtitle">
              No necesitas un proyecto eterno para mejorar la puerta. Activas, entrenas a tu equipo y empiezas a ver
              orden desde la primera noche.
            </p>
            <ul className="assurance-list">
              {assurances.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="assurance-box__actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                trackLandingEvent('cta_activate_event_click', { location: 'assurance' })
                onActivateClick()
              }}
            >
              ACTIVAR NOCHE AHORA
            </button>
            <a
              href="#formulario"
              className="btn btn--secondary"
              onClick={() => trackLandingEvent('cta_schedule_demo_click', { location: 'assurance' })}
            >
              QUIERO ASESORIA EXPRESS
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
