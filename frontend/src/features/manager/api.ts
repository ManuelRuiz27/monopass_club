import { coreHttpClient } from '@/lib/httpClient'

export type ClubDTO = {
  id: string
  name: string
  capacity: number
  active: boolean
}

export type EventAssignmentDTO = {
  id: string
  eventId: string
  rpId: string
  limitAccesses: number | null
  usedAccesses: number
  rp: {
    id: string
    active: boolean
    user: {
      id: string
      name: string
      username: string
    }
  }
}

export type EventDTO = {
  id: string
  name: string
  startsAt: string
  endsAt: string
  active: boolean
  club: {
    id: string
    name: string
    active: boolean
  }
  assignments: EventAssignmentDTO[]
  templateImageUrl?: string | null
  qrPositionX?: number | null
  qrPositionY?: number | null
  qrSize?: number | null
}

export type RpAssignmentSummary = {
  id: string
  event: {
    id: string
    name: string
    startsAt: string
    endsAt: string
    active: boolean
  }
  limitAccesses: number | null
  usedAccesses: number
}

export type RpDTO = {
  id: string
  active: boolean
  user: {
    id: string
    name: string
    username: string
  }
  assignments: RpAssignmentSummary[]
}

export type ScannerDTO = {
  id: string
  active: boolean
  user: {
    id: string
    name: string
    username: string
  }
  lastScanAt: string | null
}

export type CutRpSummary = {
  rpId: string
  rpName: string
  totalGeneral: number
  totalVip: number
  totalOther: number
  total: number
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
  total: number
  rps: CutRpSummary[]
}

export type CutsResponse = {
  filters: {
    eventId: string | null
    rpId: string | null
    from: string | null
    to: string | null
  }
  total: number
  totalGeneral: number
  totalVip: number
  totalOther: number
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
  updateClub: (clubId: string, payload: Partial<Pick<ClubDTO, 'name' | 'capacity' | 'active'>>) =>
    coreHttpClient.patch<ClubDTO>(`/clubs/${clubId}`, payload),
  deleteClub: (clubId: string) => coreHttpClient.delete<void>(`/clubs/${clubId}`),
  getEvents: () => coreHttpClient.get<EventDTO[]>('/events'),
  createEvent: (payload: { clubId: string; name: string; startsAt: string; endsAt: string }) =>
    coreHttpClient.post<EventDTO>('/events', payload),
  updateEvent: (eventId: string, payload: Partial<{ name: string; startsAt: string; endsAt: string; active: boolean }>) =>
    coreHttpClient.patch<EventDTO>(`/events/${eventId}`, payload),
  getRps: () => coreHttpClient.get<RpDTO[]>('/rps'),
  createRp: (payload: { name: string; username: string; password: string }) => coreHttpClient.post('/rps', payload),
  updateRp: (rpId: string, payload: { name?: string; active?: boolean }) =>
    coreHttpClient.patch<RpDTO>(`/rps/${rpId}`, payload),
  getScanners: () => coreHttpClient.get<ScannerDTO[]>('/scanners'),
  createScanner: (payload: { name: string; username: string; password: string }) => coreHttpClient.post('/scanners', payload),
  updateScanner: (scannerId: string, payload: { name?: string; active?: boolean }) =>
    coreHttpClient.patch<ScannerDTO>(`/scanners/${scannerId}`, payload),
  getOtherLabel: () => coreHttpClient.get<{ otherLabel: string }>('/settings/guest-types/other-label'),
  updateOtherLabel: (otherLabel: string) =>
    coreHttpClient.patch<{ otherLabel: string }>('/settings/guest-types/other-label', { otherLabel }),
  assignRpToEvent: (eventId: string, payload: { rpId: string; limitAccesses?: number | null }) =>
    coreHttpClient.post<EventAssignmentDTO>(`/events/${eventId}/rps`, payload),
  updateAssignmentLimit: (eventId: string, rpId: string, limitAccesses: number | null) =>
    coreHttpClient.patch<EventAssignmentDTO>(`/events/${eventId}/rps/${rpId}`, { limitAccesses }),
  removeAssignment: (eventId: string, rpId: string) => coreHttpClient.delete<void>(`/events/${eventId}/rps/${rpId}`),
  updateTemplate: (
    eventId: string,
    payload: {
      templateImageUrl?: string | null
      qrPositionX?: number | null
      qrPositionY?: number | null
      qrSize?: number | null
    },
  ) => coreHttpClient.put(`/events/${eventId}/template`, payload),
  getCuts: (params?: { eventId?: string; rpId?: string; from?: string | null; to?: string | null }) =>
    coreHttpClient.get<CutsResponse>('/cuts', {
      query: {
        eventId: params?.eventId,
        rpId: params?.rpId,
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
