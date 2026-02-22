const comparisonRows = [
  {
    traditional: 'Impresion y talonarios fisicos.',
    passMonkey: 'QR dinamico por evento con control centralizado.',
  },
  {
    traditional: 'Control manual en puerta.',
    passMonkey: 'Escaneo en tiempo real con registro de cada intento.',
  },
  {
    traditional: 'Sin metricas operativas.',
    passMonkey: 'Dashboard en vivo para equipo y direccion.',
  },
  {
    traditional: 'Riesgo alto de clonacion o reingreso.',
    passMonkey: 'Validacion + auditoria para detectar duplicados.',
  },
]

export function ComparisonSection() {
  return (
    <section className="landing-section" id="comparativo" aria-labelledby="comparison-title" data-reveal>
      <div className="landing-container">
        <header className="section-header" data-reveal>
          <p className="section-header__eyebrow">Comparativo</p>
          <h2 className="section-header__title" id="comparison-title">
            Control tradicional vs Pass Monkey
          </h2>
          <p className="section-header__description">
            Si operas eventos con equipos chicos y alta presion, necesitas trazabilidad real en la entrada.
          </p>
        </header>

        <div className="comparison-table" role="table" aria-label="Comparacion de control de acceso" data-reveal>
          <div className="comparison-table__row comparison-table__row--head" role="row">
            <span role="columnheader">Acceso tradicional</span>
            <span role="columnheader">Pass Monkey</span>
          </div>
          {comparisonRows.map((row) => (
            <div className="comparison-table__row" role="row" key={row.traditional}>
              <span role="cell">{row.traditional}</span>
              <span role="cell">{row.passMonkey}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

