import { useEffect, useRef } from 'react'
import { crossfadeCycle, fadeInOnScroll } from '../animations.ts'

const screens = [
    { icon: '📱', title: 'Escaneando...', sub: 'Apunta la cámara al código QR', color: 'var(--ld-accent)' },
    { icon: '✓', title: 'Acceso Validado', sub: 'Mesa VIP · Invitado confirmado', color: 'var(--ld-green)' },
    { icon: '📋', title: 'Nota registrada', sub: 'Acceso con observación · Staff notificado', color: 'var(--ld-accent-soft)' },
]

export function StaffDemo() {
    const cleanupRef = useRef<(() => void) | null>(null)

    useEffect(() => {
        fadeInOnScroll('.staff')
        cleanupRef.current = crossfadeCycle('.staff__screens', '.staff__screen', 2500)
        return () => cleanupRef.current?.()
    }, [])

    return (
        <section className="staff" id="staff">
            <div className="staff__content">
                <span className="staff__label">Modo Staff</span>
                <h2 className="staff__title">Optimizado para baja luz y operación rápida.</h2>
                <p className="staff__description">
                    Tu equipo de puerta valida accesos en menos de 2 segundos.
                    Diseñado para funcionar en condiciones reales de evento.
                </p>
            </div>

            <div className="staff__screens">
                {screens.map((s) => (
                    <div key={s.title} className="staff__screen">
                        <span className="staff__screen-icon">{s.icon}</span>
                        <span className="staff__screen-title" style={{ color: s.color }}>{s.title}</span>
                        <span className="staff__screen-sub">{s.sub}</span>
                    </div>
                ))}
            </div>
        </section>
    )
}
