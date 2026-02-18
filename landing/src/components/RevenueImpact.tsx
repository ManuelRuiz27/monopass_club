import { useMemo, useState } from 'react'
import { trackLandingEvent } from '../lib/analytics.ts'

type RevenueImpactProps = {
  onActivateClick: () => void
}

function asMoney(value: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value)
}

export function RevenueImpact({ onActivateClick }: RevenueImpactProps) {
  const [attendees, setAttendees] = useState(700)
  const [avgTicketPrice, setAvgTicketPrice] = useState(250)
  const [leakageRate, setLeakageRate] = useState(4)

  const numbers = useMemo(() => {
    const leakagePerEvent = attendees * avgTicketPrice * (leakageRate / 100)
    const leakagePerMonth = leakagePerEvent * 4
    const leakagePerQuarter = leakagePerMonth * 3
    const eventPrice = 750
    const basePlan = 2999
    return {
      leakagePerEvent,
      leakagePerMonth,
      leakagePerQuarter,
      eventVsRecovery: leakagePerEvent - eventPrice,
      planVsRecovery: leakagePerMonth - basePlan,
    }
  }, [attendees, avgTicketPrice, leakageRate])

  return (
    <section className="section-light" id="roi">
      <div className="container content-stack">
        <h2 className="section-title">Mide cuanto dinero te deja una puerta ordenada</h2>
        <p className="section-subtitle">
          Cuando tu acceso fluye mejor, tu noche vende mejor.
        </p>

        <div className="cards-grid cards-grid--two">
          <article className="panel-card">
            <h3>Tu escenario</h3>
            <label className="roi-field" htmlFor="roi-attendees">
              Asistentes por evento
              <input
                id="roi-attendees"
                className="lead__input"
                type="number"
                min={100}
                step={50}
                value={attendees}
                onChange={(e) => setAttendees(Number(e.target.value) || 0)}
              />
            </label>
            <label className="roi-field" htmlFor="roi-ticket-price">
              Ticket promedio (MXN)
              <input
                id="roi-ticket-price"
                className="lead__input"
                type="number"
                min={50}
                step={10}
                value={avgTicketPrice}
                onChange={(e) => setAvgTicketPrice(Number(e.target.value) || 0)}
              />
            </label>
            <label className="roi-field" htmlFor="roi-leakage">
              Fuga operativa estimada (%)
              <input
                id="roi-leakage"
                className="lead__input"
                type="number"
                min={1}
                max={20}
                step={1}
                value={leakageRate}
                onChange={(e) => setLeakageRate(Number(e.target.value) || 0)}
              />
            </label>
            <p className="roi-note">Modelo orientativo para estimar retorno potencial.</p>
          </article>

          <article className="panel-card panel-card--highlight">
            <h3>Potencial de recuperacion</h3>
            <div className="roi-metrics">
              <p>
                Recuperacion potencial por evento
                <strong>{asMoney(numbers.leakagePerEvent)}</strong>
              </p>
              <p>
                Recuperacion potencial mensual (4 eventos)
                <strong>{asMoney(numbers.leakagePerMonth)}</strong>
              </p>
              <p>
                Diferencia vs activacion por evento ($750)
                <strong>{asMoney(numbers.eventVsRecovery)}</strong>
              </p>
              <p>
                Diferencia vs Plan Club mensual ($2,999)
                <strong>{asMoney(numbers.planVsRecovery)}</strong>
              </p>
            </div>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                trackLandingEvent('cta_activate_event_click', { location: 'roi' })
                onActivateClick()
              }}
            >
              QUIERO ESTE NIVEL DE CONTROL
            </button>
          </article>
        </div>
      </div>
    </section>
  )
}
