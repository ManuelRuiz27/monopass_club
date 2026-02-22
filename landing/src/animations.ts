import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function shouldEnableMobileClubEffects() {
  return window.matchMedia('(max-width: 768px) and (pointer: coarse)').matches
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

export function initMobileClubEffects(root: HTMLElement) {
  if (prefersReducedMotion() || !shouldEnableMobileClubEffects()) return () => {}

  const doc = document.documentElement
  const body = document.body
  const hitSelector =
    '.pm-button, .pricing-card, .step-card, .benefits-list__item, .faq-item__trigger, .comparison-table__row'
  const hitTimers = new Map<HTMLElement, number>()
  const hueTo = gsap.quickTo(doc, '--pm-rave-hue', { duration: 0.4, ease: 'power2.out' })
  const intensityTo = gsap.quickTo(doc, '--pm-rave-intensity', { duration: 0.35, ease: 'power2.out' })

  const setVar = (name: string, value: string) => {
    doc.style.setProperty(name, value)
  }
  let scrollRaf: number | null = null

  const burst = () => {
    gsap.fromTo(
      doc,
      { '--pm-rave-scale': 1.16, '--pm-rave-intensity': 0.64 },
      { '--pm-rave-scale': 1, '--pm-rave-intensity': 0.28, duration: 0.85, ease: 'expo.out', overwrite: 'auto' },
    )
  }

  const updateFromScroll = () => {
    const maxScroll = Math.max(doc.scrollHeight - window.innerHeight, 1)
    const progress = Math.min(window.scrollY / maxScroll, 1)
    const nextY = 14 + progress * 62
    const nextHue = 194 + progress * 96
    const nextIntensity = 0.2 + Math.sin(progress * Math.PI) * 0.14

    setVar('--pm-rave-y', `${nextY.toFixed(2)}%`)
    hueTo(nextHue)
    intensityTo(nextIntensity)
  }

  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType === 'mouse') return

    const viewportWidth = window.innerWidth || 1
    const viewportHeight = window.innerHeight || 1
    const x = Math.min(Math.max((event.clientX / viewportWidth) * 100, 0), 100)
    const y = Math.min(Math.max((event.clientY / viewportHeight) * 100, 0), 100)
    setVar('--pm-rave-x', `${x.toFixed(2)}%`)
    setVar('--pm-rave-y', `${y.toFixed(2)}%`)
    burst()

    const target = event.target as HTMLElement | null
    const hitTarget = target?.closest<HTMLElement>(hitSelector)
    if (!hitTarget) return

    const previousTimer = hitTimers.get(hitTarget)
    if (previousTimer) window.clearTimeout(previousTimer)

    hitTarget.classList.remove('club-hit')
    void hitTarget.offsetWidth
    hitTarget.classList.add('club-hit')

    const timeout = window.setTimeout(() => {
      hitTarget.classList.remove('club-hit')
      hitTimers.delete(hitTarget)
    }, 420)

    hitTimers.set(hitTarget, timeout)
  }

  body.classList.add('mobile-club-fx')
  setVar('--pm-rave-x', '52%')
  setVar('--pm-rave-y', '16%')
  setVar('--pm-rave-hue', '202')
  setVar('--pm-rave-intensity', '0.28')
  setVar('--pm-rave-scale', '1')

  const scheduleScrollUpdate = () => {
    if (scrollRaf !== null) return
    scrollRaf = window.requestAnimationFrame(() => {
      scrollRaf = null
      updateFromScroll()
    })
  }

  updateFromScroll()
  window.addEventListener('scroll', scheduleScrollUpdate, { passive: true })
  window.addEventListener('resize', scheduleScrollUpdate)
  root.addEventListener('pointerdown', onPointerDown, { passive: true })

  return () => {
    window.removeEventListener('scroll', scheduleScrollUpdate)
    window.removeEventListener('resize', scheduleScrollUpdate)
    root.removeEventListener('pointerdown', onPointerDown)
    if (scrollRaf !== null) {
      window.cancelAnimationFrame(scrollRaf)
      scrollRaf = null
    }

    for (const [node, timer] of hitTimers.entries()) {
      window.clearTimeout(timer)
      node.classList.remove('club-hit')
    }
    hitTimers.clear()

    body.classList.remove('mobile-club-fx')
    doc.style.removeProperty('--pm-rave-x')
    doc.style.removeProperty('--pm-rave-y')
    doc.style.removeProperty('--pm-rave-hue')
    doc.style.removeProperty('--pm-rave-intensity')
    doc.style.removeProperty('--pm-rave-scale')
  }
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

