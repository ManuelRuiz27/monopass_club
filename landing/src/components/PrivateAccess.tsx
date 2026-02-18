import { useEffect } from 'react'
import { staggerReveal } from '../animations.ts'

const steps = [
    {
        number: '1',
        title: 'Solicitas acceso',
        description: 'Completas el formulario con la información de tu operación.',
    },
    {
        number: '2',
        title: 'Validamos tu operación',
        description: 'Nuestro equipo evalúa compatibilidad con la plataforma.',
    },
    {
        number: '3',
        title: 'Recibes cuenta de prueba privada',
        description: 'Acceso completo a la plataforma con soporte dedicado.',
    },
]

export function PrivateAccess() {
    useEffect(() => {
        staggerReveal('.access__steps', '.access__step')
    }, [])

    return (
        <section className="access" id="acceso">
            <h2 className="access__title">Acceso por invitación</h2>

            <div className="access__steps">
                {steps.map((s) => (
                    <div key={s.number} className="access__step">
                        <div className="access__step-number">{s.number}</div>
                        <div className="access__step-content">
                            <h4>{s.title}</h4>
                            <p>{s.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}
