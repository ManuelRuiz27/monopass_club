import { useEffect, type RefObject } from 'react'
import { gsap } from 'gsap'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

type Options = {
  hoverScale?: number
  pressScale?: number
  hoverDuration?: number
  pressDuration?: number
}

export function useGsapInteractiveScale(
  scopeRef: RefObject<HTMLElement | null>,
  selector: string,
  refreshKey?: unknown,
  options?: Options,
) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const hoverScale = options?.hoverScale ?? 1.02
  const pressScale = options?.pressScale ?? 0.97
  const hoverDuration = options?.hoverDuration ?? 0.14
  const pressDuration = options?.pressDuration ?? 0.1

  useEffect(() => {
    if (prefersReducedMotion) return

    const scope = scopeRef.current
    if (!scope) return

    const targets = gsap.utils.toArray<HTMLElement>(selector, scope)
    if (targets.length === 0) return

    const cleanups: Array<() => void> = []

    targets.forEach((target) => {
      if (target.matches(':disabled') || target.getAttribute('aria-disabled') === 'true') return

      const onEnter = () => {
        gsap.to(target, { scale: hoverScale, duration: hoverDuration, ease: 'power2.out' })
      }
      const onLeave = () => {
        gsap.to(target, { scale: 1, duration: hoverDuration, ease: 'power2.out' })
      }
      const onDown = () => {
        gsap.to(target, { scale: pressScale, duration: pressDuration, ease: 'power2.out' })
      }
      const onUp = () => {
        gsap.to(target, { scale: hoverScale, duration: pressDuration, ease: 'power2.out' })
      }

      target.addEventListener('pointerenter', onEnter)
      target.addEventListener('pointerleave', onLeave)
      target.addEventListener('pointerdown', onDown)
      target.addEventListener('pointerup', onUp)
      target.addEventListener('pointercancel', onLeave)

      cleanups.push(() => {
        target.removeEventListener('pointerenter', onEnter)
        target.removeEventListener('pointerleave', onLeave)
        target.removeEventListener('pointerdown', onDown)
        target.removeEventListener('pointerup', onUp)
        target.removeEventListener('pointercancel', onLeave)
        gsap.killTweensOf(target)
        gsap.set(target, { clearProps: 'transform' })
      })
    })

    return () => {
      cleanups.forEach((cleanup) => cleanup())
    }
  }, [hoverDuration, hoverScale, pressDuration, pressScale, prefersReducedMotion, refreshKey, scopeRef, selector])
}
