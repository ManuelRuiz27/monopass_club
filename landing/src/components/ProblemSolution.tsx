import { useEffect } from 'react'
import { staggerReveal } from '../animations.ts'

const problems = [
    { icon: '✗', text: 'Papel y listas improvisadas' },
    { icon: '✗', text: 'Duplicidad de accesos' },
    { icon: '✗', text: 'Fricción en puerta' },
    { icon: '✗', text: 'Falta de visibilidad operativa' },
]

const solutions = [
    { icon: '✦', text: 'Accesos digitales elegantes' },
    { icon: '✦', text: 'Validación instantánea' },
    { icon: '✦', text: 'Operación optimizada' },
    { icon: '✦', text: 'Control por sede' },
]

export function ProblemSolution() {
    useEffect(() => {
        staggerReveal('.ps__col--problem', '.ps__item')
        staggerReveal('.ps__col--solution', '.ps__item')
    }, [])

    return (
        <section className="ps" id="problema">
            <div className="ps__grid">
                <div className="ps__col ps__col--problem">
                    <span className="ps__label ps__label--problem">El problema</span>
                    {problems.map((p) => (
                        <div key={p.text} className="ps__item">
                            <span className="ps__icon">{p.icon}</span>
                            {p.text}
                        </div>
                    ))}
                </div>

                <div className="ps__col ps__col--solution">
                    <span className="ps__label ps__label--solution">La solución</span>
                    {solutions.map((s) => (
                        <div key={s.text} className="ps__item ps__item--solution">
                            <span className="ps__icon">{s.icon}</span>
                            {s.text}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
