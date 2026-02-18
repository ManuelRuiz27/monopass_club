export type LandingEventName =
  | 'landing_page_view'
  | 'landing_section_view'
  | 'cta_activate_event_click'
  | 'cta_view_pricing_click'
  | 'cta_schedule_demo_click'
  | 'pricing_plan_selected'
  | 'lead_form_started'
  | 'lead_form_submit_attempt'
  | 'lead_form_submit_validation_error'
  | 'lead_form_submit_success'
  | 'lead_form_submit_error'
  | 'activation_modal_open'
  | 'activation_modal_close'
  | 'activation_submit_attempt'
  | 'activation_redirect_checkout'
  | 'activation_submit_error'
  | 'checkout_status_view'
  | 'checkout_status_loaded'
  | 'checkout_status_error'

type TrackOptions = {
  dedupeKey?: string
}

const dedupeEventKeys = new Set<string>()

declare global {
  interface Window {
    __landingEventLog?: Array<Record<string, unknown>>
  }
}

export function trackLandingEvent(
  eventName: LandingEventName,
  payload?: Record<string, unknown>,
  options?: TrackOptions,
) {
  if (typeof window === 'undefined') return

  const dedupeKey = options?.dedupeKey?.trim()
  if (dedupeKey) {
    if (dedupeEventKeys.has(dedupeKey)) return
    dedupeEventKeys.add(dedupeKey)
  }

  const eventPayload = { event: eventName, ...payload }
  const dataLayer = (window as Window & { dataLayer?: Array<Record<string, unknown>> }).dataLayer
  if (Array.isArray(dataLayer)) {
    dataLayer.push(eventPayload)
  }

  if (!Array.isArray(window.__landingEventLog)) {
    window.__landingEventLog = []
  }
  window.__landingEventLog.push(eventPayload)
}
