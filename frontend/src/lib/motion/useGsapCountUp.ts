import { useLayoutEffect, type RefObject } from 'react'
import { gsap } from 'gsap'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

type Options = {
  duration?: number
  stagger?: number
}

function createFormatter(decimals: number) {
  return new Intl.NumberFormat('es', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function useGsapCountUp(
  scopeRef: RefObject<HTMLElement | null>,
  selector: string,
  refreshKey?: unknown,
  options?: Options,
) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const duration = options?.duration ?? 0.72
  const stagger = options?.stagger ?? 0.06

  useLayoutEffect(() => {
    if (prefersReducedMotion) return

    const scope = scopeRef.current
    if (!scope) return

    const elements = gsap.utils.toArray<HTMLElement>(selector, scope)
    if (elements.length === 0) return

    const tweens: gsap.core.Tween[] = []

    elements.forEach((element, index) => {
      const targetValue = Number(element.dataset.countTarget)
      if (!Number.isFinite(targetValue)) return

      const suffix = element.dataset.countSuffix ?? ''
      const precision = Number.parseInt(element.dataset.countPrecision ?? '0', 10) || 0
      const formatter = createFormatter(precision)
      const multiplier = 10 ** precision
      const state = { value: 0 }

      element.textContent = `${formatter.format(0)}${suffix}`

      const tween = gsap.to(state, {
        value: targetValue,
        duration,
        delay: index * stagger,
        ease: 'power2.out',
        onUpdate: () => {
          const rounded = Math.round(state.value * multiplier) / multiplier
          element.textContent = `${formatter.format(rounded)}${suffix}`
        },
        onComplete: () => {
          element.textContent = `${formatter.format(targetValue)}${suffix}`
        },
      })

      tweens.push(tween)
    })

    return () => {
      tweens.forEach((tween) => tween.kill())
    }
  }, [duration, prefersReducedMotion, refreshKey, scopeRef, selector, stagger])
}
