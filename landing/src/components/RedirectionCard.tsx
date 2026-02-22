import { Ticket, CreditCard, ShieldCheck, Settings } from 'lucide-react'

export function RedirectionCard() {
    return (
        <section className="section-dark" id="monotickets">
            <div className="container content-stack">
                <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
                    <span className="panel-tag" style={{ marginBottom: '16px' }}>BOLETERA DIGITAL PROFESIONAL</span>
                    <h2 className="section-title">¿Tu evento requiere venta abierta al público?</h2>
                    <p className="section-subtitle" style={{ margin: '0 auto 32px' }}>
                        Si organizas festivales, conciertos, eventos con preventa online o venta con pasarela de pago, necesitas una solución a gran escala.
                    </p>
                </div>

                <div className="panel-card" style={{
                    display: 'grid',
                    gap: '40px',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    padding: '48px',
                    borderColor: 'rgba(91, 46, 255, 0.5)'
                }}>
                    <div>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '8px', fontWeight: 700 }}>
                            Monotickets <span style={{ fontWeight: 400, color: 'var(--text-soft)' }}>by Soft-Monkey</span>
                        </h3>
                        <p style={{ color: 'var(--text-soft)', lineHeight: 1.6, marginBottom: '24px' }}>
                            Si tu evento escala, aquí está la solución profesional. Venta online, control antifraude y pasarelas de pago listas en 48 hrs.
                        </p>
                        <a
                            href="https://softmonkeybar.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn--secondary"
                        >
                            Conoce Monotickets
                        </a>
                    </div>

                    <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: '1fr 1fr' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <CreditCard size={24} color="var(--neon-cyan)" />
                            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.875rem' }}>Pasarelas de pago integradas</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <ShieldCheck size={24} color="var(--neon-cyan)" />
                            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.875rem' }}>QR dinámico antifraude</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <Ticket size={24} color="var(--neon-cyan)" />
                            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.875rem' }}>Venta online al público</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <Settings size={24} color="var(--neon-cyan)" />
                            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.875rem' }}>Panel de organizador</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
