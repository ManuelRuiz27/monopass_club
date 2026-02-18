const steps = [
  { id: '01', title: 'Lanzas tu noche', desc: 'Subes flyer, fecha y puerta en minutos.' },
  { id: '02', title: 'Enciendes la preventa', desc: 'Tus accesos salen con look oficial del evento.' },
  { id: '03', title: 'Controlas la fila', desc: 'Entrada agil, staff sincronizado y menos caos.' },
]

export function HowItWorks() {
  return (
    <section className="section-light" id="como-funciona">
      <div className="container content-stack">
        <div className="section-brand section-brand--steps">
          <img src="/assets/logos/pass-monkey-mascot-3d.png" alt="Pass Monkey" />
          <span>MONOPASS RAVE FLOW</span>
        </div>
        <h2 className="section-title">Del flyer a la puerta en 3 movimientos</h2>
        <p className="section-subtitle">Menos friccion, mas hype y mas control para tu equipo.</p>
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
