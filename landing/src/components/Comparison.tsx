const rows = [
  { traditional: 'Impresion y talonarios', monkey: 'QR dinamico' },
  { traditional: 'Control manual', monkey: 'Escaneo en tiempo real' },
  { traditional: 'Sin metricas', monkey: 'Dashboard operativo' },
  { traditional: 'Riesgo de clonacion', monkey: 'Validacion + auditoria' },
  { traditional: 'Sin trazabilidad por equipo', monkey: 'Operacion por roles: manager, RP y scanner' },
]

export function Comparison() {
  return (
    <section className="section-dark" id="comparativo">
      <div className="container content-stack">
        <h2 className="section-title">Tradicional vs Pass Monkey</h2>
        <div className="comparison-table">
          <div className="comparison-row comparison-row--head">
            <span>Tradicional</span>
            <span>Pass Monkey</span>
          </div>
          {rows.map((row) => (
            <div key={row.traditional} className="comparison-row">
              <span>{row.traditional}</span>
              <span>{row.monkey}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
