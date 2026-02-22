import { useEffect } from 'react'
import { staggerReveal, progressBarOnScroll } from '../animations.ts'

const steps = [
    { number: '01', title: 'Creas tu evento' },
    { number: '02', title: 'Asignas boletos digitales a cada colaborador de venta' },
    { number: '03', title: 'Escaneas en puerta y obtienes tu corte automático' },
]

export function Steps() {
    useEffect(() => {
        progressBarOnScroll('.steps', '.steps__progress-bar')
        staggerReveal('.steps__cards', '.steps__card')
    }, [])

    return (
        <section className="steps" id="como-opera">
            <h2 className="steps__title">Cómo opera</h2>
            <p className="steps__subtitle">Triple validación desde la configuración hasta la puerta.</p>

            <div className="steps__progress">
                <div className="steps__progress-bar" />
            </div>

            <div className="steps__cards">
                {steps.map((s) => (
                    <div key={s.number} className="steps__card">
                        <span className="steps__number">{s.number}</span>
                        <h3 className="steps__card-title">{s.title}</h3>
                    </div>
                ))}
            </div>
        </section>
    )
}
