import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'

type FaqItem = {
  question: string
  answer: string
}

const faqItems: FaqItem[] = [
  {
    question: 'Que necesitas en la puerta para validar accesos?',
    answer: 'Un celular con camara y conexion estable para escanear los QR dinamicos en tiempo real.',
  },
  {
    question: 'Puedo usar Pass Monkey solo una vez?',
    answer: 'Si. Puedes activar 1 evento por pago unico y despues decidir si migras a plan mensual.',
  },
  {
    question: 'Cuanto tarda en activarse?',
    answer: 'En minutos. Creas el evento, generas accesos y ya puedes validar en puerta.',
  },
  {
    question: 'Funciona sin internet?',
    answer: 'No. Para mantener validacion y auditoria en vivo, la operacion requiere conexion en la entrada.',
  },
  {
    question: 'Puedo cambiar luego a plan mensual?',
    answer: 'Si. Puedes pasar de evento individual a Plan Club o Plan Pro cuando tu operacion lo requiera.',
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
            <h3>Te mostramos el flujo real de escaneo en una demo corta.</h3>
            <p>Agenda y revisamos tu operacion actual, tipo de acceso y volumen estimado.</p>
            <a className="pm-button pm-button--secondary" href="#cta-final">
              Ir a demo
            </a>
          </aside>
        </div>
      </div>
    </section>
  )
}

