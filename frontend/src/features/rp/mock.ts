import type {
  CreateTicketPayload,
  CreateTicketResponse,
  GuestType,
  RpEventAssignment,
  RpEventsResponse,
  TicketDeliveryMethod,
  TicketHistoryItem,
  TicketHistoryResponse,
} from './api'

const MOCK_DELAY_MS = 260

type MockState = {
  otherLabel: string
  events: RpEventAssignment[]
  tickets: TicketHistoryItem[]
}

export const rpMockEnabled = import.meta.env.VITE_RP_MOCK === 'true'

const now = new Date()
const dayMs = 24 * 60 * 60 * 1000

const mockState: MockState = {
  otherLabel: 'CORTESIA',
  events: [
    {
      assignmentId: 'asg-mock-001',
      eventId: 'evt-mock-001',
      eventName: 'Neon District Fridays',
      clubName: 'Pass Monkey Club',
      startsAt: new Date(now.getTime() + dayMs).toISOString(),
      endsAt: new Date(now.getTime() + dayMs + 6 * 60 * 60 * 1000).toISOString(),
      limitAccesses: 120,
      usedAccesses: 42,
      remainingAccesses: 78,
      guestTypeCounts: { GENERAL: 24, VIP: 14, OTHER: 4 },
      eventActive: true,
    },
    {
      assignmentId: 'asg-mock-002',
      eventId: 'evt-mock-002',
      eventName: 'Warehouse Rave Session',
      clubName: 'Mono Room',
      startsAt: new Date(now.getTime() + 2 * dayMs).toISOString(),
      endsAt: new Date(now.getTime() + 2 * dayMs + 7 * 60 * 60 * 1000).toISOString(),
      limitAccesses: 80,
      usedAccesses: 19,
      remainingAccesses: 61,
      guestTypeCounts: { GENERAL: 9, VIP: 8, OTHER: 2 },
      eventActive: true,
    },
  ],
  tickets: [
    {
      id: 'TCK-MOCK-1901',
      guestType: 'VIP',
      displayLabel: 'VIP',
      note: 'Mesa A3',
      createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
      deliveryMethod: 'WHATSAPP',
      deliveryAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      event: {
        id: 'evt-mock-001',
        name: 'Neon District Fridays',
        startsAt: new Date(now.getTime() + dayMs).toISOString(),
        active: true,
      },
    },
    {
      id: 'TCK-MOCK-1902',
      guestType: 'GENERAL',
      displayLabel: 'GENERAL',
      note: null,
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      deliveryMethod: 'DOWNLOAD',
      deliveryAt: new Date(now.getTime() - 90 * 60 * 1000).toISOString(),
      event: {
        id: 'evt-mock-002',
        name: 'Warehouse Rave Session',
        startsAt: new Date(now.getTime() + 2 * dayMs).toISOString(),
        active: true,
      },
    },
  ],
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function sleep(ms = MOCK_DELAY_MS) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function displayLabelFor(guestType: GuestType) {
  if (guestType === 'OTHER') return mockState.otherLabel
  return guestType
}

function buildTicketSvg(ticketId: string) {
  const safeId = ticketId.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="720" viewBox="0 0 720 720">
  <defs>
    <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#5B2EFF" />
      <stop offset="58%" stop-color="#12F5FF" />
      <stop offset="100%" stop-color="#CCFF00" />
    </linearGradient>
  </defs>
  <rect width="720" height="720" fill="#0A0B14" />
  <rect x="46" y="46" width="628" height="628" rx="28" fill="#14182A" stroke="url(#g1)" stroke-width="4" />
  <text x="360" y="128" text-anchor="middle" fill="#DCD8FF" font-size="34" font-family="Arial, sans-serif">PASS MONKEY ACCESS</text>
  <rect x="200" y="184" width="320" height="320" rx="22" fill="#FFFFFF" />
  <rect x="224" y="208" width="272" height="272" fill="#121212" />
  <path d="M240 224h48v48h-48zM304 224h16v16h-16zM336 224h16v16h-16zM368 224h16v16h-16zM400 224h16v16h-16zM432 224h48v48h-48zM240 288h16v16h-16zM272 288h16v16h-16zM320 288h16v16h-16zM352 288h16v16h-16zM384 288h16v16h-16zM432 288h16v16h-16zM464 288h16v16h-16zM240 320h16v16h-16zM304 320h16v16h-16zM336 320h16v16h-16zM400 320h16v16h-16zM432 320h16v16h-16zM240 352h16v16h-16zM272 352h16v16h-16zM320 352h16v16h-16zM352 352h16v16h-16zM400 352h16v16h-16zM432 352h16v16h-16zM464 352h16v16h-16zM240 384h48v48h-48zM304 416h16v16h-16zM336 384h16v16h-16zM368 416h16v16h-16zM400 384h16v16h-16zM432 384h48v48h-48z" fill="#FFF" />
  <text x="360" y="570" text-anchor="middle" fill="#F4F6FF" font-size="27" font-family="Arial, sans-serif">${safeId}</text>
  <text x="360" y="610" text-anchor="middle" fill="#9BA4CB" font-size="20" font-family="Arial, sans-serif">MOCK PREVIEW</text>
</svg>
`.trim()
}

async function getEvents(): Promise<RpEventsResponse> {
  await sleep()
  return clone({
    otherLabel: mockState.otherLabel,
    events: mockState.events,
  })
}

async function createTicket(payload: CreateTicketPayload): Promise<CreateTicketResponse> {
  await sleep()

  const event = mockState.events.find((item) => item.eventId === payload.eventId)
  if (!event) throw new Error('Evento no encontrado.')
  if (!event.eventActive) throw new Error('Evento no activo.')
  if (event.remainingAccesses !== null && event.remainingAccesses <= 0) {
    throw new Error('Limite de accesos alcanzado para este evento.')
  }

  const id = `TCK-MOCK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  const createdAt = new Date().toISOString()

  event.usedAccesses += 1
  if (event.remainingAccesses !== null) {
    event.remainingAccesses = Math.max(0, event.remainingAccesses - 1)
  }
  event.guestTypeCounts[payload.guestType] += 1

  mockState.tickets.unshift({
    id,
    guestType: payload.guestType,
    displayLabel: displayLabelFor(payload.guestType),
    note: payload.note ?? null,
    createdAt,
    deliveryMethod: null,
    deliveryAt: null,
    event: {
      id: event.eventId,
      name: event.eventName,
      startsAt: event.startsAt,
      active: event.eventActive,
    },
  })

  return clone({
    id,
    guestType: payload.guestType,
    note: payload.note ?? null,
    status: 'PENDING',
    event: {
      id: event.eventId,
      name: event.eventName,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
    },
    limitAccesses: event.limitAccesses,
    usedAccesses: event.usedAccesses,
    remainingAccesses: event.remainingAccesses,
  })
}

async function getTicketHistory(guestType?: GuestType): Promise<TicketHistoryResponse> {
  await sleep()
  const tickets = guestType ? mockState.tickets.filter((item) => item.guestType === guestType) : mockState.tickets
  return clone({
    otherLabel: mockState.otherLabel,
    tickets,
  })
}

async function getTicketImage(ticketId: string): Promise<Blob> {
  await sleep(120)
  const svg = buildTicketSvg(ticketId)
  return new Blob([svg], { type: 'image/svg+xml' })
}

async function trackTicketDelivery(ticketId: string, method: TicketDeliveryMethod) {
  await sleep(120)

  const target = mockState.tickets.find((ticket) => ticket.id === ticketId)
  if (!target) {
    throw new Error('Ticket no encontrado.')
  }

  target.deliveryMethod = method
  target.deliveryAt = new Date().toISOString()

  return clone({
    ok: true,
    ticketId,
    method,
    deliveredAt: target.deliveryAt,
  })
}

export const rpMockApi = {
  getEvents,
  createTicket,
  getTicketHistory,
  trackTicketDelivery,
  getTicketImage,
}
