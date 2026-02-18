const benefits = [
  'Menos filas y menos friccion en puerta.',
  'Reduce clonaciones y reingresos.',
  'Escaneo rapido con auditoria de accesos.',
  'Dashboard con confirmados y escaneados.',
]

export function Benefits() {
  return (
    <section className="section-dark" id="beneficios">
      <div className="container content-stack">
        <h2 className="section-title">Beneficios clave en operacion</h2>
        <div className="cards-grid cards-grid--two">
          {benefits.map((benefit) => (
            <article key={benefit} className="panel-card">
              <h3>{benefit}</h3>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

