import { useEffect, useState } from 'react'
import { trackLandingEvent } from '../lib/analytics.ts'

type StickyMobileCtaProps = {
  eventPriceLabel: string
  hidden?: boolean
  onScheduleDemo: () => void
  onActivateEvent: () => void
}

export function StickyMobileCta({ eventPriceLabel, hidden = false, onScheduleDemo, onActivateEvent }: StickyMobileCtaProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 768px)')
    const sync = () => setIsMobile(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  if (!isMobile || hidden) return null

  return (
    <div
      role="region"
      aria-label="Acciones principales"
      style={{
        position: 'fixed',
        left: 12,
        right: 12,
        bottom: 'max(12px, env(safe-area-inset-bottom))',
        zIndex: 70,
        borderRadius: 16,
        border: '1px solid rgba(181, 229, 255, 0.35)',
        background: 'rgba(6, 22, 44, 0.92)',
        backdropFilter: 'blur(6px)',
        padding: 10,
        display: 'grid',
        gap: 8,
        boxShadow: '0 10px 26px rgba(0, 12, 30, 0.42)',
      }}
    >
      <button
        type="button"
        className="pm-button pm-button--primary"
        onClick={() => {
          trackLandingEvent('cta_schedule_demo_click', { location: 'sticky_bar' })
          onScheduleDemo()
        }}
      >
        Agenda tu demo privada
      </button>
      <button
        type="button"
        className="pm-button pm-button--ghost"
        onClick={() => {
          trackLandingEvent('cta_activate_event_click', { location: 'sticky_bar' })
          onActivateEvent()
        }}
      >
        Primer evento {eventPriceLabel}
      </button>
    </div>
  )
}
