import { coreHttpClient } from '@/lib/httpClient'
import { rpMockApi, rpMockEnabled } from './mock'

export type GuestType = 'GENERAL' | 'VIP' | 'OTHER'
export type TicketDeliveryMethod = 'WHATSAPP' | 'DOWNLOAD'

export type RpEventAssignment = {
  assignmentId: string
  eventId: string
  eventName: string
  clubName: string
  startsAt: string
  endsAt: string
  limitAccesses: number | null
  usedAccesses: number
  remainingAccesses: number | null
  guestTypeCounts: Record<GuestType, number>
  eventActive: boolean
}

export type RpEventsResponse = {
  otherLabel: string
  events: RpEventAssignment[]
}

export type CreateTicketPayload = {
  eventId: string
  guestType: GuestType
  note?: string
}

export type CreateTicketResponse = {
  id: string
  guestType: GuestType
  note?: string | null
  status: string
  event: {
    id: string
    name: string
    startsAt: string
    endsAt: string
  }
  limitAccesses: number | null
  usedAccesses: number
  remainingAccesses: number | null
}

export type TicketHistoryItem = {
  id: string
  guestType: GuestType
  displayLabel: string
  note: string | null
  createdAt: string
  deliveryMethod: TicketDeliveryMethod | null
  deliveryAt: string | null
  event: {
    id: string
    name: string
    startsAt: string
    active: boolean
  }
}

export type TicketHistoryResponse = {
  otherLabel: string
  tickets: TicketHistoryItem[]
}

export const rpApi = {
  getEvents: () => (rpMockEnabled ? rpMockApi.getEvents() : coreHttpClient.get<RpEventsResponse>('/rp/events')),
  createTicket: (payload: CreateTicketPayload) =>
    rpMockEnabled ? rpMockApi.createTicket(payload) : coreHttpClient.post<CreateTicketResponse>('/tickets', payload),
  getTicketHistory: (guestType?: GuestType) =>
    rpMockEnabled
      ? rpMockApi.getTicketHistory(guestType)
      : coreHttpClient.get<TicketHistoryResponse>('/rp/tickets/history', {
          query: { guestType },
        }),
  trackTicketDelivery: (ticketId: string, method: TicketDeliveryMethod) =>
    rpMockEnabled
      ? rpMockApi.trackTicketDelivery(ticketId, method)
      : coreHttpClient.post<{ ok: boolean; ticketId: string; method: TicketDeliveryMethod; deliveredAt: string }>(
          `/rp/tickets/${ticketId}/delivery`,
          { method },
        ),
  getTicketImage: (ticketId: string) =>
    rpMockEnabled ? rpMockApi.getTicketImage(ticketId) : coreHttpClient.getBlob(`/tickets/${ticketId}/png`, { timeoutMs: 30_000 }),
}
