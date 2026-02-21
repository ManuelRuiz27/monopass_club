import { Quote } from 'lucide-react'

export function SocialProof() {
    return (
        <section className="section-dark" id="testimonios">
            <div className="container content-stack">
                <h2 className="section-title" style={{ textAlign: 'center' }}>Resultados Reales</h2>

                <div className="panel-card panel-card--highlight" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', padding: '40px' }}>
                    <div style={{ color: 'var(--acid)', marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
                        <Quote size={48} strokeWidth={1.5} />
                    </div>
                    <p style={{ fontSize: '1.25rem', lineHeight: '1.6', color: 'var(--text-main)', marginBottom: '24px', fontStyle: 'italic' }}>
                        "Hacer los cortes a las 4AM nos tomaba una hora y los talonarios eran un caos; ahora solo reviso el dashboard y cobramos exacto. Redujo las fugas un 10% el primer fin de semana."
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Alex, Gerente Operativo</span>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-soft)' }}>Nightclub Top Level</span>
                    </div>
                </div>
            </div>
        </section>
    )
}
