const roleCards = [
  {
    role: 'Manager / Dueno',
    pain: 'Necesita visibilidad de accesos y control de operacion en vivo.',
    outcome: 'Panel con confirmados, escaneados y trazabilidad por evento.',
  },
  {
    role: 'Equipo RP',
    pain: 'Comparte accesos por WhatsApp y requiere seguimiento claro.',
    outcome: 'Flujo de generacion y control de tickets sin hojas sueltas.',
  },
  {
    role: 'Staff Scanner',
    pain: 'Debe validar rapido aun con fila y baja luz.',
    outcome: 'Escaneo agil con respuesta inmediata y auditoria en puerta.',
  },
]

export function RoleFit() {
  return (
    <section className="section-dark" id="roles">
      <div className="container content-stack">
        <h2 className="section-title">Hecho para equipos reales de operacion nocturna</h2>
        <p className="section-subtitle">No es solo un QR. Es flujo operativo para manager, RP y scanner.</p>
        <div className="cards-grid cards-grid--three">
          {roleCards.map((card) => (
            <article key={card.role} className="panel-card">
              <span className="panel-tag">{card.role}</span>
              <p>{card.pain}</p>
              <h3>{card.outcome}</h3>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
