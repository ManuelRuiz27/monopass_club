import { useEffect } from 'react'
import { fadeInOnScroll } from '../animations.ts'

export function Statement() {
    useEffect(() => {
        fadeInOnScroll('.statement__text')
    }, [])

    return (
        <section className="statement">
            <p className="statement__text">
                Diseñado para organizadores que operan con estándar premium.
            </p>
        </section>
    )
}
