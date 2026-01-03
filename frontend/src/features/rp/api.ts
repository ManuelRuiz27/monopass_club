import { coreHttpClient } from '@/lib/httpClient'
import { appEnv } from '@/lib/env'

export type GuestType = 'GENERAL' | 'VIP' | 'OTHER'

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
  status: string
  note: string | null
  createdAt: string
  scannedAt: string | null
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
  getEvents: () => coreHttpClient.get<RpEventsResponse>('/rp/events'),
  createTicket: (payload: CreateTicketPayload) => coreHttpClient.post<CreateTicketResponse>('/tickets', payload),
  getTicketHistory: (guestType?: GuestType) =>
    coreHttpClient.get<TicketHistoryResponse>('/rp/tickets/history', {
      query: { guestType },
    }),
  getTicketImageUrl: (ticketId: string) => `${appEnv.publicCoreApiBaseUrl}/tickets/${ticketId}/png`,
}
