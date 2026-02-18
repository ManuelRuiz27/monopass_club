import { useLayoutEffect, type RefObject } from 'react'
import { gsap } from 'gsap'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

type RouteTransitionOptions = {
  panelSelector?: string
  duration?: number
  y?: number
}

export function useGsapRouteTransition(
  scopeRef: RefObject<HTMLElement | null>,
  routeKey: string,
  options?: RouteTransitionOptions,
) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const panelSelector = options?.panelSelector ?? '[data-gsap-route-panel]'
  const duration = options?.duration ?? 0.28
  const y = options?.y ?? 24

  useLayoutEffect(() => {
    if (prefersReducedMotion) return

    const scope = scopeRef.current
    if (!scope) return

    const panel = scope.querySelector<HTMLElement>(panelSelector)
    if (!panel) return

    const context = gsap.context(() => {
      gsap.fromTo(
        panel,
        { autoAlpha: 0, y },
        {
          autoAlpha: 1,
          y: 0,
          duration,
          ease: 'power2.out',
          clearProps: 'opacity,transform',
        },
      )
    }, scope)

    return () => context.revert()
  }, [duration, panelSelector, prefersReducedMotion, routeKey, scopeRef, y])
}
