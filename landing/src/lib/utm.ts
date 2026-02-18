export type UtmPayload = {
  source?: string
  medium?: string
  campaign?: string
  term?: string
  content?: string
}

const UTM_STORAGE_KEY = 'passmonkey_landing_utm_v1'

function parseUtmFromSearch(search: string): UtmPayload {
  const params = new URLSearchParams(search)
  const payload: UtmPayload = {}

  const source = params.get('utm_source')
  const medium = params.get('utm_medium')
  const campaign = params.get('utm_campaign')
  const term = params.get('utm_term')
  const content = params.get('utm_content')

  if (source) payload.source = source
  if (medium) payload.medium = medium
  if (campaign) payload.campaign = campaign
  if (term) payload.term = term
  if (content) payload.content = content

  return payload
}

function hasAnyUtm(payload: UtmPayload): boolean {
  return Boolean(payload.source || payload.medium || payload.campaign || payload.term || payload.content)
}

export function captureUtmFromUrl(): void {
  if (typeof window === 'undefined') return

  const payload = parseUtmFromSearch(window.location.search)
  if (!hasAnyUtm(payload)) return

  try {
    window.localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // localStorage may fail in private mode; this should not block conversion.
  }
}

export function getStoredUtm(): UtmPayload | undefined {
  if (typeof window === 'undefined') return undefined

  try {
    const raw = window.localStorage.getItem(UTM_STORAGE_KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as UtmPayload
    return hasAnyUtm(parsed) ? parsed : undefined
  } catch {
    return undefined
  }
}

