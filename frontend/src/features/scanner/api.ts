import { scannerHttpClient } from '@/lib/httpClient'

export type ScannerValidateResponse = {
  valid: boolean
  reason: 'ALREADY_SCANNED' | 'INVALID_TOKEN' | null
  ticket: null | {
    ticketId: string
    eventId: string
    guestType: string
    displayLabel: string
    note: string | null
    status: 'PENDING' | 'SCANNED'
    scannedAt: string | null
  }
}

export type ScannerConfirmResponse = {
  confirmed: boolean
  reason: 'ALREADY_SCANNED' | 'INVALID_TOKEN' | null
  ticket: ScannerValidateResponse['ticket']
}

export type ScannerCutRpSummary = {
  rpId: string
  rpName: string
  totalGeneral: number
  totalVip: number
  totalOther: number
  total: number
}

export type ScannerCutEventSummary = {
  eventId: string
  eventName: string
  clubName: string
  startsAt: string
  endsAt: string
  totalGeneral: number
  totalVip: number
  totalOther: number
  total: number
  rps: ScannerCutRpSummary[]
}

export type ScannerCutsResponse = {
  filters: {
    eventId: string | null
    from: string | null
    to: string | null
  }
  availableEvents: Array<{
    eventId: string
    eventName: string
  }>
  pagination: {
    totalEvents: number
    limit: number
    offset: number
    hasMore: boolean
  }
  total: number
  totalGeneral: number
  totalVip: number
  totalOther: number
  events: ScannerCutEventSummary[]
}

export type ScannerCutDetailResponse = {
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
  pagination: {
    limit: number
    offset: number
    hasMore: boolean
  }
  scans: Array<{
    ticketId: string
    guestType: string
    displayLabel: string
    note: string | null
    scannedAt: string
    scannerName: string
  }>
}

export const scannerApi = {
  validate: (payload: { qrToken: string }) =>
    scannerHttpClient.post<ScannerValidateResponse>('/scan/validate', payload),
  confirm: (payload: { qrToken: string; clientRequestId: string }) =>
    scannerHttpClient.post<ScannerConfirmResponse>('/scan/confirm', payload),
  getCuts: (params?: { eventId?: string; from?: string | null; to?: string | null; limit?: number; offset?: number }) =>
    scannerHttpClient.get<ScannerCutsResponse>('/cuts', {
      query: {
        eventId: params?.eventId,
        from: params?.from ?? undefined,
        to: params?.to ?? undefined,
        limit: params?.limit,
        offset: params?.offset,
      },
    }),
  getCutDetail: (
    eventId: string,
    rpId: string,
    params?: { from?: string | null; to?: string | null; limit?: number; offset?: number },
  ) =>
    scannerHttpClient.get<ScannerCutDetailResponse>(`/cuts/${eventId}/rps/${rpId}`, {
      query: {
        from: params?.from ?? undefined,
        to: params?.to ?? undefined,
        limit: params?.limit,
        offset: params?.offset,
      },
    }),
}
