import { useState } from 'react'

const faqItems = [
  {
    q: '¿Es complicado para mi staff?',
    a: 'No. Solo escanean con la cámara del celular desde la app.',
  },
  {
    q: '¿Qué pasa si se va el internet?',
    a: 'El sistema tiene modo offline por evento.',
  },
  {
    q: '¿Cómo sé que realmente funciona?',
    a: 'En el primer evento verás el corte detallado por colaborador de venta y accesos reales escaneados.',
  },
  {
    q: '¿Esto reemplaza mi flujo en efectivo?',
    a: 'No. Solo reemplaza el talonario físico y ordena tu operación.',
  },
]

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number>(0)

  return (
    <section className="section-light" id="faq">
      <div className="container content-stack">
        <h2 className="section-title">Preguntas frecuentes</h2>
        <div className="faq-list">
          {faqItems.map((item, index) => {
            const open = openIndex === index
            return (
              <article key={item.q} className="faq-item">
                <button
                  type="button"
                  className="faq-question"
                  onClick={() => setOpenIndex(open ? -1 : index)}
                  aria-expanded={open}
                >
                  <span>{item.q}</span>
                  <span>{open ? '−' : '+'}</span>
                </button>
                {open && <p className="faq-answer">{item.a}</p>}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
