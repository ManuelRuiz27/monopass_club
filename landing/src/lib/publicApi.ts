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
  city: string
  phone: string
  email?: string
  eventDate?: string
  estimatedVolume: number
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
