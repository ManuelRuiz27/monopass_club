import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'

type FaqItem = {
  question: string
  answer: string
}

const faqItems: FaqItem[] = [
  {
    question: 'Que necesita mi staff para operar en puerta?',
    answer: 'Un celular por acceso y una breve induccion. El flujo es escanear, validar y continuar fila.',
  },
  {
    question: 'Si falla internet, se detiene la entrada?',
    answer: 'No. El modo offline mantiene el acceso operativo con cache por evento y sincroniza al volver la señal.',
  },
  {
    question: 'Como confio en el corte por colaborador de venta?',
    answer: 'Cada validacion queda registrada. El corte sale con respaldo y trazabilidad por colaborador.',
  },
  {
    question: 'En cuanto tiempo veo retorno?',
    answer: 'Depende de tu operacion, pero normalmente se percibe al reducir fugas y tiempo de arqueo en caja.',
  },
  {
    question: 'Puedo usar Pass Monkey si la mayoria del flujo es en efectivo?',
    answer: 'Si. Esta pensado para eventos cash-heavy donde necesitas control interno y cierre claro al final.',
  },
  {
    question: 'Puedo empezar con un solo evento y luego escalar?',
    answer: 'Si. Puedes activar tu primer evento y despues pasar a plan mensual cuando tu agenda crezca.',
  },
]

function detectReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function FaqSection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(0)
  const [reducedMotion, setReducedMotion] = useState(detectReducedMotion)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = () => setReducedMotion(media.matches)
    media.addEventListener('change', handleChange)

    return () => media.removeEventListener('change', handleChange)
  }, [])

  return (
    <section className="landing-section faq-section" id="faq" aria-labelledby="faq-title" data-reveal>
      <div className="landing-container">
        <header className="section-header" data-reveal>
          <p className="section-header__eyebrow">FAQ</p>
          <h2 className="section-header__title" id="faq-title">
            Preguntas frecuentes antes de activar.
          </h2>
        </header>

        <div className="faq-layout" data-reveal>
          <div className="faq-list">
            {faqItems.map((item, index) => {
              const isOpen = activeIndex === index
              return (
                <article className="faq-item" key={item.question}>
                  <h3>
                    <button
                      type="button"
                      className="faq-item__trigger"
                      aria-expanded={isOpen}
                      aria-controls={`faq-panel-${index}`}
                      onClick={() => setActiveIndex((current) => (current === index ? null : index))}
                    >
                      <span>{item.question}</span>
                      <ChevronDown size={16} aria-hidden="true" className={isOpen ? 'faq-item__icon is-open' : 'faq-item__icon'} />
                    </button>
                  </h3>
                  <div
                    id={`faq-panel-${index}`}
                    className={isOpen ? 'faq-item__panel is-open' : 'faq-item__panel'}
                    style={reducedMotion ? { transition: 'none' } : undefined}
                  >
                    <p>{item.answer}</p>
                  </div>
                </article>
              )
            })}
          </div>

          <aside className="faq-side-card">
            <p className="faq-side-card__kicker">Todavia con dudas?</p>
            <h3>Agenda tu demo privada y revisamos tu flujo real de puerta.</h3>
            <p>En la llamada vemos cortes, colaboradores, internet en sitio y opciones para tu siguiente fecha.</p>
            <a className="pm-button pm-button--secondary" href="#cta-final">
              Agenda tu demo privada
            </a>
          </aside>
        </div>
      </div>
    </section>
  )
}

