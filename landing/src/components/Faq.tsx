import { useState } from 'react'

const faqItems = [
  {
    q: 'Que necesito en puerta?',
    a: 'Necesitas 1 celular por scanner y conexion activa para validacion en tiempo real.',
  },
  {
    q: 'Puedo usarlo solo una vez?',
    a: 'Si. Puedes activar un unico evento por $750 MXN sin contrato mensual.',
  },
  {
    q: 'Cuanto tarda en activarse?',
    a: 'La activacion inicia al confirmar pago y puedes seguir el estatus de orden/provisioning en la pagina de checkout.',
  },
  {
    q: 'Funciona sin internet?',
    a: 'No. Requiere conexion activa para validar accesos en tiempo real.',
  },
  {
    q: 'Puedo cambiar a plan mensual despues?',
    a: 'Si. Puedes migrar a Plan Club o Plan Pro desde el panel.',
  },
  {
    q: 'Esto solo sirve para el scanner?',
    a: 'No. Incluye flujo operativo para manager, equipo RP y scanner en un mismo sistema.',
  },
  {
    q: 'Que pasa si quiero ayuda antes del evento?',
    a: 'Te apoyamos en configuracion y checklist operativo para que tu equipo llegue listo a puerta.',
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
                  <span>{open ? '-' : '+'}</span>
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
