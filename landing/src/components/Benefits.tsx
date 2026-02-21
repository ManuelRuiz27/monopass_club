import { Zap } from 'lucide-react'

export function Benefits() {
  return (
    <section className="section-dark" id="beneficios">
      <div className="container content-stack">
        <h2 className="section-title">Beneficio Económico</h2>
        <p className="section-subtitle">
          Si pierdes entre 5% y 10% en boletos físicos, en un evento grande eso puede representar miles de pesos.
        </p>
        <div className="bento-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '600px', margin: '0 auto' }}>
          <article className="panel-card panel-card--bento panel-card--wide" style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--acid)', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
              <Zap size={48} strokeWidth={1.5} />
            </div>
            <h3>Menos de lo que pierdes</h3>
            <p>Pass Monkey cuesta menos que una sola fuga significativa en tu puerta.</p>
          </article>
        </div>
      </div>
    </section>
  )
}
