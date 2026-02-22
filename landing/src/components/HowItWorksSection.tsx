import type { LucideIcon } from 'lucide-react'
import { CalendarPlus2, QrCode, ScanLine } from 'lucide-react'

type Step = {
  title: string
  description: string
  outcome: string
  icon: LucideIcon
}

const steps: Step[] = [
  {
    title: 'Crea tu evento',
    description: 'Sube el diseno de tu acceso y habilita a tu equipo para empezar a vender en minutos.',
    outcome: 'Tu operacion queda lista cuando tu decides, sin depender de terceros.',
    icon: CalendarPlus2,
  },
  {
    title: 'Genera accesos digitales',
    description: 'Tu equipo crea boletos en la app y los comparte por WhatsApp en el mismo flujo.',
    outcome: 'Sin papel, menos errores manuales y mejor trazabilidad.',
    icon: QrCode,
  },
  {
    title: 'Valida en puerta en segundos',
    description: 'Tu staff escanea y registra cada entrada al instante con validacion anti-clonacion.',
    outcome: 'Monitorea aforo y ventas en vivo desde el dashboard, donde estes.',
    icon: ScanLine,
  },
]

export function HowItWorksSection() {
  return (
    <section className="landing-section" id="como-funciona" aria-labelledby="how-it-works-title" data-reveal>
      <div className="landing-container">
        <header className="section-header" data-reveal>
          <p className="section-header__eyebrow">Como funciona</p>
          <h2 className="section-header__title" id="how-it-works-title">
            Digitaliza tu proximo evento en solo 3 pasos.
          </h2>
          <p className="section-header__description">Un flujo claro para vender, validar y controlar sin caos operativo.</p>
        </header>
        <div className="steps-grid steps-grid--flow" role="list">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <article className="step-card" key={step.title} role="listitem" data-reveal>
                <div className="step-card__icon" aria-hidden="true">
                  <Icon size={20} />
                </div>
                <p className="step-card__number">Paso {index + 1}</p>
                <h3 className="step-card__title">{step.title}</h3>
                <p className="step-card__description">{step.description}</p>
                <p className="step-card__outcome">{step.outcome}</p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

