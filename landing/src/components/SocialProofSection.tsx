const placeholders = [
  {
    title: 'Testimonio de manager',
    content: '(Testimonio real aqui: experiencia de corte y control en puerta).',
  },
  {
    title: 'Metrica operativa',
    content: '(Metrica real aqui: tiempo de acceso, incidencias o mejoras en cortes).',
  },
  {
    title: 'Caso de evento cash-heavy',
    content: '(Caso real aqui: como se organizo el flujo de colaboradores y acceso).',
  },
]

export function SocialProofSection() {
  return (
    <section className="landing-section" id="prueba-social" aria-labelledby="social-proof-title" data-reveal>
      <div className="landing-container">
        <header className="section-header" data-reveal>
          <p className="section-header__eyebrow">Prueba social</p>
          <h2 className="section-header__title" id="social-proof-title">
            Referencias listas para validar en tu demo privada.
          </h2>
          <p className="section-header__description">
            Esta seccion esta preparada para integrar testimonios y metricas verificables sin inflar promesas.
          </p>
        </header>

        <div className="cards-grid" role="list">
          {placeholders.map((item) => (
            <article className="panel-card" key={item.title} role="listitem" data-reveal>
              <h3>{item.title}</h3>
              <p>{item.content}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
