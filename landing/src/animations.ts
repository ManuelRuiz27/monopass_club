import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const prefersReducedMotion = (): boolean =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Hero entrance: split-reveal headline + fade-translate mockup.
 * Total duration ≤ 1.2s.
 */
export function animateHero(): void {
    if (prefersReducedMotion()) return

    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })

    tl.from('.hero__headline', {
        y: 60,
        opacity: 0,
        duration: 0.7,
        clearProps: 'all',
    })
        .from(
            '.hero__sub',
            { y: 30, opacity: 0, duration: 0.5, clearProps: 'all' },
            '-=0.35',
        )
        .from(
            '.hero__ctas',
            { y: 20, opacity: 0, duration: 0.4, clearProps: 'all' },
            '-=0.25',
        )
        .from(
            '.hero__media',
            { y: 50, opacity: 0, duration: 0.7, clearProps: 'all' },
            '-=0.5',
        )
}

/**
 * Generic fade-in + translateY on scroll for a single element.
 */
export function fadeInOnScroll(selector: string, options?: { y?: number; duration?: number }): void {
    if (prefersReducedMotion()) return

    gsap.from(selector, {
        scrollTrigger: {
            trigger: selector,
            start: 'top 85%',
            once: true,
        },
        y: options?.y ?? 40,
        opacity: 0,
        duration: options?.duration ?? 0.7,
        ease: 'power2.out',
        clearProps: 'all',
    })
}

/**
 * Staggered reveal for a list of children inside a parent.
 */
export function staggerReveal(parentSelector: string, childSelector: string): void {
    if (prefersReducedMotion()) return

    gsap.from(`${parentSelector} ${childSelector}`, {
        scrollTrigger: {
            trigger: parentSelector,
            start: 'top 80%',
            once: true,
        },
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power2.out',
        clearProps: 'all',
    })
}

/**
 * Animated progress bar that fills as user scrolls through a section.
 */
export function progressBarOnScroll(
    triggerSelector: string,
    barSelector: string,
): void {
    if (prefersReducedMotion()) return

    gsap.fromTo(
        barSelector,
        { scaleX: 0 },
        {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: {
                trigger: triggerSelector,
                start: 'top 70%',
                end: 'bottom 50%',
                scrub: true,
            },
        },
    )
}

/**
 * Crossfade between child elements inside a container (for StaffDemo).
 */
export function crossfadeCycle(
    containerSelector: string,
    itemSelector: string,
    intervalMs: number = 2500,
): (() => void) {
    const items = document.querySelectorAll(`${containerSelector} ${itemSelector}`)
    if (items.length === 0) return () => { }

    let current = 0
    items.forEach((item, i) => {
        gsap.set(item, { opacity: i === 0 ? 1 : 0, position: i === 0 ? 'relative' : 'absolute' })
    })

    const interval = setInterval(() => {
        if (prefersReducedMotion()) return

        const prev = current
        current = (current + 1) % items.length

        gsap.to(items[prev], { opacity: 0, duration: 0.6, ease: 'power2.out' })
        gsap.to(items[current], { opacity: 1, duration: 0.6, ease: 'power2.out' })
    }, intervalMs)

    return () => clearInterval(interval)
}
