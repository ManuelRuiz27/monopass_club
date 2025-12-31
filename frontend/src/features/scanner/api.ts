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

export const scannerApi = {
  validate: (payload: { qrToken: string }) =>
    scannerHttpClient.post<ScannerValidateResponse>('/scan/validate', payload),
  confirm: (payload: { qrToken: string; clientRequestId?: string }) =>
    scannerHttpClient.post<ScannerConfirmResponse>('/scan/confirm', payload),
}
