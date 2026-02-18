import { trackLandingEvent } from '../lib/analytics.ts'

type SalesAssuranceProps = {
  onActivateClick: () => void
}

const assurances = [
  'Activacion guiada y checklist operativo previo al evento.',
  'Sin permanencia forzada: pagas por evento o mensual segun operacion.',
  'Soporte para equipo manager, RP y scanner durante implementacion.',
  'Estatus de orden y provisioning visibles despues del checkout.',
]

export function SalesAssurance({ onActivateClick }: SalesAssuranceProps) {
  return (
    <section className="section-dark" id="respaldo">
      <div className="container content-stack">
        <h2 className="section-title">Compra con menos riesgo operativo</h2>
        <div className="assurance-box">
          <div className="assurance-box__content">
            <p className="section-subtitle">
              Tu equipo no necesita aprender otro sistema complejo. El flujo esta disenado para arrancar rapido y operar
              bajo presion real de puerta.
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
              Activar ahora
            </button>
            <a
              href="#formulario"
              className="btn btn--secondary"
              onClick={() => trackLandingEvent('cta_schedule_demo_click', { location: 'assurance' })}
            >
              Quiero llamada de 15 min
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
