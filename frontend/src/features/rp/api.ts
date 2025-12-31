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

export const rpApi = {
  getEvents: () => coreHttpClient.get<RpEventsResponse>('/rp/events'),
  createTicket: (payload: CreateTicketPayload) => coreHttpClient.post<CreateTicketResponse>('/tickets', payload),
  getTicketImageUrl: (ticketId: string) => `${appEnv.coreApiBaseUrl}/tickets/${ticketId}/image`,
}
