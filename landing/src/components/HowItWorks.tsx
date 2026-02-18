const steps = [
  { id: '01', title: 'Crea tu evento', desc: 'Configura nombre, horario y puerta de acceso.' },
  { id: '02', title: 'Genera accesos digitales', desc: 'Comparte QR dinamico para invitados y staff.' },
  { id: '03', title: 'Valida en puerta', desc: 'Escaneo rapido con trazabilidad en tiempo real.' },
]

export function HowItWorks() {
  return (
    <section className="section-light" id="como-funciona">
      <div className="container content-stack">
        <h2 className="section-title">Digitaliza tu proximo evento en 3 pasos.</h2>
        <p className="section-subtitle">Operacion clara. Sin papel. Sin caos.</p>
        <div className="cards-grid cards-grid--three">
          {steps.map((step) => (
            <article key={step.id} className="panel-card">
              <span className="panel-tag">{step.id}</span>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

