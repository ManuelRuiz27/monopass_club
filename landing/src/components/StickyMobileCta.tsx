import { trackLandingEvent } from '../lib/analytics.ts'

type StickyMobileCtaProps = {
  onScheduleMeeting: () => void
}

export function StickyMobileCta({ onScheduleMeeting }: StickyMobileCtaProps) {
  return (
    <div className="sticky-mobile-cta" role="region" aria-label="Accion principal">
      <span>Agenda tu reunion</span>
      <button
        className="btn btn--primary sticky-mobile-cta__btn"
        onClick={() => {
          trackLandingEvent('cta_schedule_demo_click', { location: 'sticky_bar' })
          onScheduleMeeting()
        }}
      >
        AGENDAR
      </button>
    </div>
  )
}
