import { trackLandingEvent } from '../lib/analytics.ts'

const rows = [
  {
    traditional: 'Boletos impresos y capturas de pantalla que se duplican facil.',
    monkey: 'QR dinamico y validacion en segundos para cerrar la puerta al fraude.',
  },
  {
    traditional: 'Tablas de control con RP por WhatsApp y datos dispersos.',
    monkey: 'Panel unico por rol: manager, RP y staff trabajando con la misma data.',
  },
  {
    traditional: 'Corte de caja hasta el final, sin saber que pasa en tiempo real.',
    monkey: 'Lectura en vivo de accesos para decidir rapido mientras la noche explota.',
  },
  {
    traditional: 'Fila lenta que enfria el hype y te baja conversion en puerta.',
    monkey: 'Entrada fluida con experiencia premium desde el primer escaneo.',
  },
  {
    traditional: 'Operacion dependiente de memoria, papel y urgencias.',
    monkey: 'Flujo repetible para escalar fechas sin perder control ni margen.',
  },
]

const wins = [
  'Menos fugas por accesos duplicados.',
  'Mas velocidad en puerta durante hora pico.',
  'Mas confianza para cobrar y escalar preventa.',
]

export function Comparison() {
  return (
    <section className="section-dark" id="comparativo">
      <div className="container content-stack comparison">
        <div className="comparison__top">
          <div className="comparison__pitch">
            <h2 className="section-title">Seguir en papel te sale caro cada fin de semana</h2>
            <p className="section-subtitle">
              Pass Monkey reemplaza boletos impresos y tablas manuales por una puerta que cobra mejor, valida mas
              rapido y mantiene al equipo en control.
            </p>
          </div>
          <div className="comparison__logo-stage" aria-hidden="true">
            <img src="/assets/logos/pass-monkey-neon-letters.png" alt="" className="comparison__logo-back" />
            <img src="/assets/logos/pass-monkey-lockup-3d.png" alt="" className="comparison__logo-front" />
          </div>
        </div>
        <div className="comparison__wins">
          {wins.map((item) => (
            <p key={item} className="comparison__win">
              {item}
            </p>
          ))}
        </div>
        <div className="comparison-table">
          <div className="comparison-row comparison-row--head">
            <span>Metodo viejo</span>
            <span>Pass Monkey mode</span>
          </div>
          {rows.map((row) => (
            <div key={row.traditional} className="comparison-row">
              <span>{row.traditional}</span>
              <span>{row.monkey}</span>
            </div>
          ))}
        </div>
        <a
          href="#formulario"
          className="comparison__cta btn btn--primary"
          onClick={() => trackLandingEvent('cta_schedule_demo_click', { location: 'comparison' })}
        >
          QUIERO SALIR DEL METODO VIEJO
        </a>
      </div>
    </section>
  )
}
