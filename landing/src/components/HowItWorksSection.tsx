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
    description: 'Configura fecha, aforo y reglas de acceso desde un solo panel.',
    outcome: 'Tu operacion queda lista para vender.',
    icon: CalendarPlus2,
  },
  {
    title: 'Genera accesos digitales',
    description: 'Entrega QR dinamicos por canal digital sin depender de boletos impresos.',
    outcome: 'Tu equipo y tus clientes tienen el mismo folio.',
    icon: QrCode,
  },
  {
    title: 'Valida en puerta en segundos',
    description: 'Tu staff escanea y registra cada entrada con trazabilidad operativa.',
    outcome: 'Controlas aforo y auditoria en tiempo real.',
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
            Digitaliza tu proximo evento en 3 pasos.
          </h2>
          <p className="section-header__description">Operacion clara. Sin papel. Sin caos.</p>
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
                <h3>{step.title}</h3>
                <p>{step.description}</p>
                <p className="step-card__outcome">{step.outcome}</p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

