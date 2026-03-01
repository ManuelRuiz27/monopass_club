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
  const [leakageRate, setLeakageRate] = useState(5)

  const numbers = useMemo(() => {
    const leakagePerEvent = attendees * avgTicketPrice * (leakageRate / 100)
    const leakagePerMonth = leakagePerEvent * 4
    return {
      leakagePerEvent,
      leakagePerMonth,
    }
  }, [attendees, avgTicketPrice, leakageRate])

  return (
    <section className="section-light" id="roi">
      <div className="container content-stack">
        <h2 className="section-title" style={{ textAlign: 'center', maxWidth: '24ch', marginInline: 'auto' }}>
          Mide cuanto dinero te deja una puerta ordenada
        </h2>
        <p className="section-subtitle" style={{ textAlign: 'center' }}>
          Cuando tu acceso fluye mejor, tu noche vende mejor.
        </p>

        <div className="cards-grid cards-grid--two" style={{ marginTop: '24px' }}>
          <article className="panel-card" style={{ display: 'grid', gap: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--pm-text)' }}>Tu escenario</h3>

            <div className="roi-slider-group">
              <div className="roi-slider-header">
                <label htmlFor="roi-attendees">Asistentes por evento</label>
                <span className="roi-slider-value">{attendees} pax</span>
              </div>
              <input
                id="roi-attendees"
                className="roi-slider"
                type="range"
                min={100}
                max={1000}
                step={50}
                value={attendees}
                onChange={(e) => setAttendees(Number(e.target.value))}
              />
            </div>

            <div className="roi-slider-group">
              <div className="roi-slider-header">
                <label htmlFor="roi-ticket-price">Ticket promedio (MXN)</label>
                <span className="roi-slider-value">{asMoney(avgTicketPrice)}</span>
              </div>
              <input
                id="roi-ticket-price"
                className="roi-slider"
                type="range"
                min={50}
                max={1500}
                step={50}
                value={avgTicketPrice}
                onChange={(e) => setAvgTicketPrice(Number(e.target.value))}
              />
            </div>

            <div className="roi-slider-group">
              <div className="roi-slider-header">
                <label htmlFor="roi-leakage">Fuga operativa estimada</label>
                <span className="roi-slider-value">{leakageRate}%</span>
              </div>
              <input
                id="roi-leakage"
                className="roi-slider"
                type="range"
                min={2}
                max={15}
                step={1}
                value={leakageRate}
                onChange={(e) => setLeakageRate(Number(e.target.value))}
              />
              <p className="roi-note" style={{ marginTop: '8px' }}>El estandar de la industria sin Pass Monkey ronda el 5-8%.</p>
            </div>
          </article>

          <article className="panel-card panel-card--highlight" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center', gap: '24px' }}>
            <div>
              <p style={{ margin: '0 0 8px', color: 'var(--pm-text-soft)', fontSize: '1rem', fontWeight: 600 }}>
                Estás perdiendo alrededor de
              </p>
              <p style={{ margin: 0, fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 800, color: 'var(--pm-danger)', lineHeight: 1, letterSpacing: '-0.02em' }}>
                {asMoney(numbers.leakagePerEvent)}
              </p>
              <p style={{ margin: '8px 0 0', color: 'var(--pm-text-muted)', fontSize: '0.9rem' }}>
                Fuga de efectivo por noche
              </p>
            </div>

            <div style={{ padding: '16px', background: 'rgba(255, 109, 147, 0.08)', borderRadius: '12px', border: '1px solid rgba(255, 109, 147, 0.2)' }}>
              <p style={{ margin: 0, color: '#fdd3df', fontSize: '0.95rem' }}>
                En un mes de 4 eventos, esto suma <strong>{asMoney(numbers.leakagePerMonth)}</strong>.
              </p>
            </div>

            <button
              type="button"
              className="pm-button pm-button--primary"
              style={{ width: '100%', marginTop: 'auto', background: 'linear-gradient(132deg, #ff1a55, #ff4c7d 50%, #ff8caf 100%)', boxShadow: '0 18px 36px rgba(255, 26, 85, 0.35)', borderColor: 'rgba(255, 126, 161, 0.9)' }}
              onClick={() => {
                trackLandingEvent('cta_activate_event_click', { location: 'roi' })
                onActivateClick()
              }}
            >
              DETENER FUGAS AHORA
            </button>
          </article>
        </div>
      </div>
    </section>
  )
}
