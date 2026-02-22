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
    outcome: 'Tu operacion queda lista en minutos.',
    icon: CalendarPlus2,
  },
  {
    title: 'Asigna accesos a colaboradores',
    description: 'Cada colaborador de venta recibe sus accesos y comparte por su canal habitual.',
    outcome: 'Cada acceso queda vinculado para el corte.',
    icon: QrCode,
  },
  {
    title: 'Escanea y cierra corte automatico',
    description: 'Tu staff valida en puerta y el sistema consolida movimientos en tiempo real.',
    outcome: 'Cierre claro por colaborador de venta sin recalcular en papel.',
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
            Controla tu noche en 3 pasos claros.
          </h2>
          <p className="section-header__description">Flujo simple para puerta, colaboradores y corte final.</p>
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

