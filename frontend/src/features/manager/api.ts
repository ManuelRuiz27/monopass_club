import { coreHttpClient } from '@/lib/httpClient'

export type ClubDTO = {
  id: string
  name: string
  capacity: number
  active: boolean
}

export type EventDTO = {
  id: string
  name: string
  startsAt: string
  endsAt: string
  clubId: string
  templateImageUrl?: string | null
}

export type RpDTO = {
  id: string
  active: boolean
  user: {
    id: string
    name: string
    username: string
  }
}

export type ScannerDTO = RpDTO

export type CutRpSummary = {
  rpId: string
  rpName: string
  totalGeneral: number
  totalVip: number
  totalOther: number
  totalScanned: number
}

export type CutEventSummary = {
  eventId: string
  eventName: string
  startsAt: string
  endsAt: string
  clubName: string
  totalGeneral: number
  totalVip: number
  totalOther: number
  totalScanned: number
  rps: CutRpSummary[]
}

export type CutsResponse = {
  events: CutEventSummary[]
}

export type CutDetailResponse = {
  event: {
    id: string
    name: string
    startsAt: string
    endsAt: string
  }
  rp: {
    id: string
    name: string
  }
  total: number
  scans: Array<{
    ticketId: string
    guestType: string
    displayLabel: string
    note: string | null
    scannedAt: string
    scannerName: string
  }>
}

export const managerApi = {
  getClubs: () => coreHttpClient.get<ClubDTO[]>('/clubs'),
  createClub: (payload: { name: string; capacity: number }) => coreHttpClient.post<ClubDTO>('/clubs', payload),
  getEvents: () => coreHttpClient.get<(EventDTO & { club: { id: string; name: string } })[]>('/events'),
  createEvent: (payload: { clubId: string; name: string; startsAt: string; endsAt: string }) =>
    coreHttpClient.post<EventDTO>('/events', payload),
  getRps: () => coreHttpClient.get<RpDTO[]>('/rps'),
  createRp: (payload: { name: string; username: string; password: string }) => coreHttpClient.post('/rps', payload),
  getScanners: () => coreHttpClient.get<ScannerDTO[]>('/scanners'),
  createScanner: (payload: { name: string; username: string; password: string }) =>
    coreHttpClient.post('/scanners', payload),
  getOtherLabel: () => coreHttpClient.get<{ otherLabel: string }>('/settings/guest-types/other-label'),
  updateOtherLabel: (otherLabel: string) =>
    coreHttpClient.patch<{ otherLabel: string }>('/settings/guest-types/other-label', { otherLabel }),
  assignRpToEvent: (eventId: string, payload: { rpId: string; limitAccesses?: number | null }) =>
    coreHttpClient.post(`/events/${eventId}/rps`, payload),
  updateTemplate: (eventId: string, payload: {
    templateImageUrl?: string | null
    qrPositionX?: number | null
    qrPositionY?: number | null
    qrSize?: number | null
  }) => coreHttpClient.put(`/events/${eventId}/template`, payload),
  getCuts: (params?: { eventId?: string; from?: string | null; to?: string | null }) =>
    coreHttpClient.get<CutsResponse>('/cuts', {
      query: {
        eventId: params?.eventId,
        from: params?.from ?? undefined,
        to: params?.to ?? undefined,
      },
    }),
  getCutDetail: (eventId: string, rpId: string, params?: { from?: string | null; to?: string | null }) =>
    coreHttpClient.get<CutDetailResponse>(`/cuts/${eventId}/rps/${rpId}`, {
      query: {
        from: params?.from ?? undefined,
        to: params?.to ?? undefined,
      },
    }),
}
