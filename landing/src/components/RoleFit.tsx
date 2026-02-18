const roleCards = [
  {
    role: 'Manager / Dueno',
    pain: 'Quiere una noche llena sin perder control de puerta.',
    outcome: 'Panel en vivo con accesos claros y ritmo operativo estable.',
  },
  {
    role: 'Equipo RP',
    pain: 'Necesita mover invitados rapido y sin confusiones.',
    outcome: 'Accesos listos para compartir con imagen oficial del evento.',
  },
  {
    role: 'Staff Scanner',
    pain: 'Debe mantener la fila fluyendo bajo presion real.',
    outcome: 'Validacion inmediata para una entrada limpia y continua.',
  },
]

export function RoleFit() {
  return (
    <section className="section-dark" id="roles">
      <div className="container content-stack">
        <h2 className="section-title">Cada rol entra en sincronia de club grande</h2>
        <p className="section-subtitle">Tu equipo deja de improvisar y empieza a operar como marca premium.</p>
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
