import { trackLandingEvent } from '../lib/analytics.ts'

const tapeSalesMessage =
  'ADIOS BOLETOS IMPRESOS /// CONTROLA TU PUERTA EN VIVO /// USA TU FLYER COMO ACCESO /// AGENDA VENTAS PASS MONKEY ///'

export function TheTape() {
  return (
    <a
      className="tape"
      href="#formulario"
      id="tape"
      onClick={() => trackLandingEvent('cta_schedule_demo_click', { location: 'tape' })}
    >
      <div className="tape__track" aria-hidden="true">
        <span>{tapeSalesMessage}</span>
        <span>{tapeSalesMessage}</span>
        <span>{tapeSalesMessage}</span>
      </div>
      <span className="tape__sr">Ir a ventas</span>
    </a>
  )
}
