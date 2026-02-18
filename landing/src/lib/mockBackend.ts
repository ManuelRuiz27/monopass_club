import type { LandingOrderStatusResponse } from './publicApi.ts'

const ORDERS_STORAGE_KEY = 'landing_mock_orders_v1'
const LEADS_STORAGE_KEY = 'landing_mock_leads_v1'

type MockScenario = 'success' | 'pending' | 'failure'

type MockActivationBody = {
  clubName?: string
  city?: string
  ownerName?: string
  ownerEmail?: string
  phone?: string
}

type MockLeadBody = {
  name?: string
  club?: string
  city?: string
  phone?: string
  estimatedVolume?: number
}

declare global {
  interface Window {
    __landingMockBackendInstalled?: boolean
  }
}

function isMockEnabled() {
  return import.meta.env.VITE_LANDING_MOCK_BACKEND === 'true'
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseJsonBody(body: BodyInit | null | undefined): Record<string, unknown> {
  if (typeof body !== 'string') return {}
  try {
    return JSON.parse(body) as Record<string, unknown>
  } catch {
    return {}
  }
}

function generateId(prefix: string) {
  const random = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${Date.now()}_${random}`
}

function readOrders() {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, LandingOrderStatusResponse>
  } catch {
    return {}
  }
}

function saveOrders(orders: Record<string, LandingOrderStatusResponse>) {
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders))
}

function persistLead(payload: MockLeadBody) {
  try {
    const raw = localStorage.getItem(LEADS_STORAGE_KEY)
    const current = raw ? (JSON.parse(raw) as Array<Record<string, unknown>>) : []
    current.push({
      id: generateId('lead'),
      createdAt: new Date().toISOString(),
      ...payload,
    })
    localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(current))
  } catch {
    // Ignore storage errors in mock mode.
  }
}

function resolveScenario(payload: MockActivationBody): MockScenario {
  const signal = `${payload.clubName ?? ''} ${payload.city ?? ''}`.toLowerCase()
  if (signal.includes('pending')) return 'pending'
  if (signal.includes('fail') || signal.includes('failure')) return 'failure'
  return 'success'
}

function buildOrder(orderId: string, scenario: MockScenario): LandingOrderStatusResponse {
  const now = new Date().toISOString()

  if (scenario === 'pending') {
    return {
      orderId,
      paymentStatus: 'PENDING',
      provisioningStatus: 'NOT_STARTED',
      amount: 750,
      currency: 'MXN',
      createdAt: now,
      paidAt: null,
      credentialsEmailSentAt: null,
      credentialsEmailError: null,
    }
  }

  if (scenario === 'failure') {
    return {
      orderId,
      paymentStatus: 'FAILED',
      provisioningStatus: 'FAILED',
      amount: 750,
      currency: 'MXN',
      createdAt: now,
      paidAt: null,
      credentialsEmailSentAt: null,
      credentialsEmailError: 'Pago rechazado en modo mock.',
    }
  }

  return {
    orderId,
    paymentStatus: 'PAID',
    provisioningStatus: 'PROVISIONED',
    amount: 750,
    currency: 'MXN',
    createdAt: now,
    paidAt: now,
    credentialsEmailSentAt: now,
    credentialsEmailError: null,
  }
}

function routeToMockPath(pathname: string) {
  if (pathname === '/landing/pricing') return 'pricing'
  if (pathname === '/landing/leads') return 'leads'
  if (pathname === '/landing/events/activation') return 'activation'
  if (/^\/landing\/orders\/[^/]+$/.test(pathname)) return 'order'
  return null
}

export function installMockBackend() {
  if (!isMockEnabled()) return
  if (window.__landingMockBackendInstalled) return

  const originalFetch = window.fetch.bind(window)

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const requestUrl =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url

    const method = (init?.method ?? (typeof input === 'string' || input instanceof URL ? 'GET' : input.method)).toUpperCase()
    const url = new URL(requestUrl, window.location.origin)
    const mockPath = routeToMockPath(url.pathname)

    if (!mockPath) return originalFetch(input, init)

    await sleep(300)

    if (mockPath === 'pricing' && method === 'GET') {
      return jsonResponse({
        event_price: 750,
        base_price: 2999,
        pro_price: 5000,
        currency: 'MXN',
      })
    }

    if (mockPath === 'leads' && method === 'POST') {
      const payload = parseJsonBody(init?.body) as MockLeadBody
      if (!payload.name || !payload.club || !payload.city || !payload.phone || !payload.estimatedVolume) {
        return jsonResponse({ message: 'Datos incompletos para registrar lead.' }, 400)
      }
      persistLead(payload)
      return jsonResponse({ id: generateId('lead'), status: 'created' }, 201)
    }

    if (mockPath === 'activation' && method === 'POST') {
      const payload = parseJsonBody(init?.body) as MockActivationBody
      if (!payload.ownerName || !payload.ownerEmail || !payload.clubName || !payload.city || !payload.phone) {
        return jsonResponse({ message: 'Completa todos los campos requeridos.' }, 400)
      }

      const scenario = resolveScenario(payload)
      const orderId = generateId('order')
      const orders = readOrders()
      orders[orderId] = buildOrder(orderId, scenario)
      saveOrders(orders)

      return jsonResponse(
        {
          orderId,
          paymentUrl: `${window.location.origin}/checkout/${scenario}?orderId=${orderId}`,
        },
        201,
      )
    }

    if (mockPath === 'order' && method === 'GET') {
      const orderId = url.pathname.split('/').at(-1)
      if (!orderId) return jsonResponse({ message: 'Order id invalido.' }, 400)

      const order = readOrders()[orderId]
      if (!order) return jsonResponse({ message: 'Orden no encontrada en mock.' }, 404)
      return jsonResponse(order)
    }

    return jsonResponse({ message: 'Endpoint mock no soportado.' }, 404)
  }

  window.__landingMockBackendInstalled = true
  console.info('[landing] Mock backend enabled')
}
