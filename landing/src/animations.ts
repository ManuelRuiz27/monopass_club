import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function initHeroTimeline(root: HTMLElement) {
  if (prefersReducedMotion()) return () => {}

  let frameIntervalId: number | undefined

  const context = gsap.context(() => {
    const phoneFrames = gsap.utils.toArray<HTMLElement>('[data-hero-phone-frame]')
    const flowSteps = gsap.utils.toArray<HTMLElement>('[data-hero-flow-step]')
    const timeline = gsap.timeline({ defaults: { ease: 'power2.out' } })

    // Faster hero entrance to avoid sluggish first impression.
    timeline
      .from('[data-hero-kicker]', { opacity: 0, y: 14, duration: 0.45 })
      .from('[data-hero-title-line]', { opacity: 0, y: 28, duration: 0.65 }, '+=0.08')
      .from('[data-hero-subtitle]', { opacity: 0, y: 18, duration: 0.5 }, '-=0.18')
      .from('[data-hero-actions]', { opacity: 0, y: 16, duration: 0.45 }, '-=0.2')
      .from('[data-hero-microcopy]', { opacity: 0, y: 12, duration: 0.36 }, '-=0.18')
      .from('[data-hero-segments]', { opacity: 0, y: 12, duration: 0.36 }, '-=0.2')
      .from('[data-hero-media]', { opacity: 0, x: 20, duration: 0.6 }, '-=0.2')

    if (phoneFrames.length > 0) {
      phoneFrames.forEach((frame, index) => frame.classList.toggle('is-active', index === 0))
      flowSteps.forEach((step, index) => step.classList.toggle('is-active', index === 0))
    }

    if (phoneFrames.length > 1) {
      let currentIndex = 0
      frameIntervalId = window.setInterval(() => {
        const nextIndex = (currentIndex + 1) % phoneFrames.length
        phoneFrames[currentIndex]?.classList.remove('is-active')
        flowSteps[currentIndex]?.classList.remove('is-active')
        phoneFrames[nextIndex]?.classList.add('is-active')
        flowSteps[nextIndex]?.classList.add('is-active')
        currentIndex = nextIndex
      }, 2100)
    }
  }, root)

  return () => {
    if (frameIntervalId !== undefined) {
      window.clearInterval(frameIntervalId)
    }
    context.revert()
  }
}

export function initScrollReveals(root: HTMLElement) {
  if (prefersReducedMotion()) return () => {}

  const context = gsap.context(() => {
    const revealElements = gsap.utils.toArray<HTMLElement>('[data-reveal]')

    revealElements.forEach((element, index) => {
      gsap.from(element, {
        y: 26,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
        delay: Math.min((index % 4) * 0.05, 0.15),
        scrollTrigger: {
          trigger: element,
          start: 'top 84%',
          once: true,
        },
      })
    })
  }, root)

  return () => context.revert()
}

// Backward-compatible helpers still used by legacy landing components.
export function animateHero() {
  if (prefersReducedMotion()) return

  gsap.from('.hero__headline', {
    y: 42,
    opacity: 0,
    duration: 0.8,
    ease: 'power2.out',
    clearProps: 'all',
  })
}

export function fadeInOnScroll(selector: string, options?: { y?: number; duration?: number }) {
  if (prefersReducedMotion()) return

  gsap.from(selector, {
    scrollTrigger: {
      trigger: selector,
      start: 'top 85%',
      once: true,
    },
    y: options?.y ?? 26,
    opacity: 0,
    duration: options?.duration ?? 0.75,
    ease: 'power2.out',
    clearProps: 'all',
  })
}

export function staggerReveal(parentSelector: string, childSelector: string) {
  if (prefersReducedMotion()) return

  gsap.from(`${parentSelector} ${childSelector}`, {
    scrollTrigger: {
      trigger: parentSelector,
      start: 'top 82%',
      once: true,
    },
    y: 20,
    opacity: 0,
    duration: 0.65,
    stagger: 0.12,
    ease: 'power2.out',
    clearProps: 'all',
  })
}

export function progressBarOnScroll(triggerSelector: string, barSelector: string) {
  if (prefersReducedMotion()) return

  gsap.fromTo(
    barSelector,
    { scaleX: 0 },
    {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: triggerSelector,
        start: 'top 75%',
        end: 'bottom 45%',
        scrub: true,
      },
    },
  )
}

export function crossfadeCycle(containerSelector: string, itemSelector: string, intervalMs = 2500): () => void {
  const items = document.querySelectorAll(`${containerSelector} ${itemSelector}`)
  if (items.length === 0) return () => {}

  let current = 0
  items.forEach((item, index) => {
    gsap.set(item, { opacity: index === 0 ? 1 : 0, position: index === 0 ? 'relative' : 'absolute' })
  })

  const interval = window.setInterval(() => {
    if (prefersReducedMotion()) return
    const previous = current
    current = (current + 1) % items.length
    gsap.to(items[previous], { opacity: 0, duration: 0.55, ease: 'power2.out' })
    gsap.to(items[current], { opacity: 1, duration: 0.55, ease: 'power2.out' })
  }, intervalMs)

  return () => window.clearInterval(interval)
}

