import { trackLandingEvent } from '../lib/analytics.ts'

type StickyMobileCtaProps = {
  onActivateClick: () => void
}

export function StickyMobileCta({ onActivateClick }: StickyMobileCtaProps) {
  return (
    <div className="sticky-mobile-cta" role="region" aria-label="Accion principal">
      <span>Desde $750 MXN</span>
      <button
        type="button"
        className="btn btn--primary"
        onClick={() => {
          trackLandingEvent('cta_activate_event_click', { location: 'sticky_mobile' })
          onActivateClick()
        }}
      >
        Activar evento
      </button>
    </div>
  )
}
