import { Ticket, QrCode, Smartphone } from 'lucide-react'

export function HowItWorks() {
  return (
    <section className="section-light" id="como-funciona">
      <div className="container content-stack">
        <h2 className="section-title">Listo para operar en 3 pasos</h2>
        <p className="section-subtitle">Sin instalaciones complicadas. Sin capacitaciones largas.</p>
        <div className="cards-grid cards-grid--three" style={{ marginTop: '32px' }}>

          <article className="panel-card" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: '-10px', bottom: '-20px', fontSize: '8rem', fontWeight: 800, color: 'rgba(255,255,255,0.02)', lineHeight: 1, pointerEvents: 'none', userSelect: 'none', fontFamily: 'Chakra Petch' }}>
              01
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(204, 255, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--acid)', marginBottom: '16px', border: '1px solid rgba(204, 255, 0, 0.2)' }}>
              <Ticket size={24} strokeWidth={1.5} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Configura y Personaliza</h3>
            <p style={{ position: 'relative', zIndex: 1 }}>Crea tu evento y personaliza tus accesos digitales. Asigna listas y cupos a tus RPs en segundos.</p>
          </article>

          <article className="panel-card" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: '-10px', bottom: '-20px', fontSize: '8rem', fontWeight: 800, color: 'rgba(255,255,255,0.02)', lineHeight: 1, pointerEvents: 'none', userSelect: 'none', fontFamily: 'Chakra Petch' }}>
              02
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(204, 255, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--acid)', marginBottom: '16px', border: '1px solid rgba(204, 255, 0, 0.2)' }}>
              <QrCode size={24} strokeWidth={1.5} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Distribuye con Agilidad</h3>
            <p style={{ position: 'relative', zIndex: 1 }}>Tus RPs envían QRs desde su celular directo al cliente. Tu cierre operativo es exacto y sin listas de papel.</p>
          </article>

          <article className="panel-card" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: '-10px', bottom: '-20px', fontSize: '8rem', fontWeight: 800, color: 'rgba(255,255,255,0.02)', lineHeight: 1, pointerEvents: 'none', userSelect: 'none', fontFamily: 'Chakra Petch' }}>
              03
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(204, 255, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--acid)', marginBottom: '16px', border: '1px solid rgba(204, 255, 0, 0.2)' }}>
              <Smartphone size={24} strokeWidth={1.5} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Valida en puerta</h3>
            <p style={{ position: 'relative', zIndex: 1 }}>Tu staff escanea con el celular. Sin equipo extra, sin apps complicadas.</p>
          </article>
        </div>
      </div>
    </section>
  )
}
