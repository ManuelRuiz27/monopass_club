import { useEffect, useState } from 'react'

export function usePrefersReducedMotion() {
  const forceDisableMotion = import.meta.env.VITE_DISABLE_MOTION === 'true'
  const [systemPrefersReducedMotion, setSystemPrefersReducedMotion] = useState(false)

  useEffect(() => {
    if (forceDisableMotion) return

    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setSystemPrefersReducedMotion(mediaQuery.matches)

    updatePreference()

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updatePreference)
      return () => mediaQuery.removeEventListener('change', updatePreference)
    }

    mediaQuery.addListener(updatePreference)
    return () => mediaQuery.removeListener(updatePreference)
  }, [forceDisableMotion])

  return forceDisableMotion || systemPrefersReducedMotion
}
