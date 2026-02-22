import type { UtmPayload } from './utm.ts'

const API_BASE_URL = import.meta.env.VITE_CORE_API_BASE_URL ?? ''

type HttpMethod = 'GET' | 'POST'

async function requestJson<TResponse>(
  path: string,
  method: HttpMethod,
  body?: unknown,
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const fallbackText = await response.text().catch(() => '')
    throw new Error(fallbackText || `Request failed with status ${response.status}`)
  }

  return (await response.json()) as TResponse
}

export type LandingPricing = {
  event_price: number
  base_price: number
  pro_price: number
  currency: string
}

export type LandingLeadPayload = {
  name: string
  club: string
  city?: string
  phone: string
  email?: string
  eventDate?: string
  estimatedVolume?: number
  utm?: UtmPayload
}

export type LandingLeadResponse = {
  id: string
  status: 'created'
}

export type LandingActivationPayload = {
  clubName: string
  city: string
  ownerName: string
  ownerEmail: string
  phone: string
  utm?: UtmPayload
}

export type LandingActivationResponse = {
  orderId: string
  paymentUrl: string
}

export type LandingOrderStatusResponse = {
  orderId: string
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED'
  provisioningStatus: 'NOT_STARTED' | 'PROVISIONED' | 'FAILED'
  amount: number
  currency: string
  createdAt: string
  paidAt: string | null
  credentialsEmailSentAt: string | null
  credentialsEmailError: string | null
}

export type LandingDemoGuestType = 'GENERAL' | 'VIP' | 'CORTESIA'

export type LandingDemoTicket = {
  id: string
  code: string
  eventName: string
  guestType: LandingDemoGuestType
  note: string | null
  issuedAtIso: string
  weekKey: string
  sequence: number
  status: 'issued' | 'used'
  usedAtIso: string | null
  qrPayload: string
}

export type LandingDemoStore = {
  weekKey: string
  lastSequence: number
  activeTicketId: string | null
  tickets: LandingDemoTicket[]
}

export type LandingDemoSessionResponse = {
  sessionId: string
  store: LandingDemoStore
}

export type LandingDemoIssueTicketResponse = {
  status: 'created'
  sessionId: string
  store: LandingDemoStore
  ticket: LandingDemoTicket
}

export type LandingDemoValidateStatus =
  | 'valid'
  | 'already_used'
  | 'not_found'
  | 'code_mismatch'
  | 'invalid_signature'
  | 'invalid_week'
  | 'invalid_format'

export type LandingDemoValidateResponse = {
  sessionId: string
  status: LandingDemoValidateStatus
  scannedAtIso: string
  parsed?: {
    weekKey: string
    ticketId: string
    code: string
    signature: string
  }
  ticket?: LandingDemoTicket
  store: LandingDemoStore
}

export type LandingDemoResetResponse = {
  status: 'reset'
  sessionId: string
  store: LandingDemoStore
}

export function getLandingPricing() {
  return requestJson<LandingPricing>('/landing/pricing', 'GET')
}

export function createLandingLead(payload: LandingLeadPayload) {
  return requestJson<LandingLeadResponse>('/landing/leads', 'POST', payload)
}

export async function createLandingActivation(payload: LandingActivationPayload) {
  const response = await fetch(`${API_BASE_URL}/landing/events/activation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>
  return { status: response.status, body }
}

export function getLandingOrderStatus(orderId: string) {
  return requestJson<LandingOrderStatusResponse>(`/landing/orders/${orderId}`, 'GET')
}

export function getLandingDemoSession(sessionId: string) {
  return requestJson<LandingDemoSessionResponse>(`/landing/demo-sessions/${encodeURIComponent(sessionId)}`, 'GET')
}

export function issueLandingDemoTicket(sessionId: string, payload: { guestType: LandingDemoGuestType; note?: string | null }) {
  return requestJson<LandingDemoIssueTicketResponse>(
    `/landing/demo-sessions/${encodeURIComponent(sessionId)}/tickets`,
    'POST',
    payload,
  )
}

export function validateLandingDemoTicket(sessionId: string, payload: { rawPayload: string }) {
  return requestJson<LandingDemoValidateResponse>(
    `/landing/demo-sessions/${encodeURIComponent(sessionId)}/validate`,
    'POST',
    payload,
  )
}

export function resetLandingDemoSession(sessionId: string) {
  return requestJson<LandingDemoResetResponse>(`/landing/demo-sessions/${encodeURIComponent(sessionId)}/reset`, 'POST')
}
