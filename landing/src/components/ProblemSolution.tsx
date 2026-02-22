import { XCircle, CheckCircle2 } from 'lucide-react'

const problems = [
    'Talonarios físicos que se mojan o pierden',
    'Fugas en puerta imposibles de rastrear',
    'Cortes de RPs a las 4 AM en papel',
    'Boletos duplicados o pasados por reja',
    'Dependencia de imprentas cada semana',
]

const solutions = [
    'Tickets generados en segundos por WhatsApp',
    'Control de aforo y caja en tiempo real',
    'Corte automático por RP sin calcular nada',
    'Escáner offline bloquea el 100% de duplicados',
    'Inventario digital infinito sin costo de papel',
]

export function ProblemSolution() {
    return (
        <section className="section-dark" id="problema">
            <div className="container content-stack">
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '-16px' }}>
                    <span className="panel-tag" style={{ borderColor: 'rgba(255, 47, 102, 0.5)', color: 'var(--alert)' }}>
                        EL PROBLEMA REAL
                    </span>
                </div>
                <h2 className="section-title" style={{ textAlign: 'center' }}>Antes vs Después</h2>

                <div className="cards-grid cards-grid--two" style={{ marginTop: '32px' }}>
                    <article className="panel-card" style={{ borderColor: 'rgba(255, 47, 102, 0.2)', background: 'linear-gradient(160deg, rgba(255, 47, 102, 0.05), rgba(7, 7, 16, 0.8))' }}>
                        <h3 style={{ color: 'var(--alert)', fontSize: '1.4rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <XCircle size={24} />
                            El Caos Físico (Antes)
                        </h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '12px' }}>
                            {problems.map((p, i) => (
                                <li key={i} style={{ display: 'flex', gap: '12px', color: 'var(--text-soft)', alignItems: 'start' }}>
                                    <span style={{ color: 'var(--alert)', marginTop: '2px' }}>✗</span>
                                    <span>{p}</span>
                                </li>
                            ))}
                        </ul>
                    </article>

                    <article className="panel-card panel-card--highlight">
                        <h3 style={{ color: 'var(--acid)', fontSize: '1.4rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CheckCircle2 size={24} />
                            Control Total (Después)
                        </h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '12px' }}>
                            {solutions.map((s, i) => (
                                <li key={i} style={{ display: 'flex', gap: '12px', color: 'var(--text-main)', alignItems: 'start' }}>
                                    <span style={{ color: 'var(--acid)', marginTop: '2px' }}>✓</span>
                                    <strong>{s}</strong>
                                </li>
                            ))}
                        </ul>
                    </article>
                </div>
            </div>
        </section>
    )
}
