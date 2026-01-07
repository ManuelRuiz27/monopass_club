import { useState, useEffect, useRef, useCallback } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { scannerApi, type ScannerValidateResponse } from '../api'
import { Modal } from '@/components/Modal'

export function ScannerPage() {
  const [qrToken, setQrToken] = useState('')
  const [lastScannedToken, setLastScannedToken] = useState<string | null>(null)

  // State for the current operation
  const [status, setStatus] = useState<'IDLE' | 'VALIDATING' | 'CONFIRMING' | 'SUCCESS' | 'ERROR'>('IDLE')
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null)
  const [ticketData, setTicketData] = useState<ScannerValidateResponse['ticket'] | null>(null)

  // Modal state for notes
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [pendingNoteToken, setPendingNoteToken] = useState<string | null>(null)

  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const isProcessingRef = useRef(false) // To prevent double scans while processing

  // Audio refs for feedback (simple beep approach using browser Audio if available, or just visual)
  // implementing visual primarily as requested.

  const handleReset = useCallback(() => {
    setStatus('IDLE')
    setFeedback(null)
    setTicketData(null)
    setQrToken('')
    isProcessingRef.current = false
    if (scannerRef.current) {
      scannerRef.current.resume()
    }
  }, [])

  const handleConfirm = async (token: string) => {
    setStatus('CONFIRMING')
    try {
      const clientRequestId = crypto.randomUUID()
      const response = await scannerApi.confirm({
        qrToken: token,
        clientRequestId,
      })

      if (response.confirmed) {
        setStatus('SUCCESS')
        setFeedback({ message: 'Acceso Permitido', type: 'success' })
        setTicketData(response.ticket)
        // Auto reset after success for continuous scanning
        setTimeout(() => {
          handleReset()
        }, 3000)
      } else {
        setStatus('ERROR')
        setFeedback({
          message: response.reason === 'ALREADY_SCANNED' ? 'Ya ingresó previamente' : 'Error al confirmar',
          type: 'error'
        })
        isProcessingRef.current = false // Allow retry
        // Don't auto reset on error maybe? or yes? Let's auto reset error too so they can try again.
        setTimeout(() => {
          handleReset()
        }, 3000)
      }
    } catch (error) {
      setStatus('ERROR')
      setFeedback({ message: (error as Error).message ?? 'Error de conexión', type: 'error' })
      isProcessingRef.current = false
    }
  }

  const handleScan = useCallback(async (decodedText: string) => {
    if (isProcessingRef.current) return
    if (decodedText === lastScannedToken && status !== 'IDLE') return // Debounce same token if not idle

    isProcessingRef.current = true
    setLastScannedToken(decodedText)
    setQrToken(decodedText) // Sync input
    setStatus('VALIDATING')
    setFeedback({ message: 'Validando...', type: 'info' })
    if (scannerRef.current) {
      scannerRef.current.pause()
    }

    try {
      const response = await scannerApi.validate({ qrToken: decodedText })

      if (!response.valid) {
        setStatus('ERROR')
        setFeedback({
          message: response.reason === 'ALREADY_SCANNED' ? 'Ticket YA Usado' : 'Token Inválido',
          type: 'error'
        })
        setTicketData(response.ticket) // Might be null or have partial info

        setTimeout(() => {
          handleReset()
        }, 3000)
        return
      }

      // If valid
      const ticket = response.ticket
      setTicketData(ticket)

      if (ticket?.status === 'SCANNED') {
        setStatus('ERROR') // Or warning
        setFeedback({ message: 'Este ticket YA fue escaneado', type: 'warning' })
        setTimeout(() => handleReset(), 3000)
        return
      }

      if (ticket?.note) {
        // Has note -> Show Modal
        setPendingNoteToken(decodedText)
        setShowNoteModal(true)
        // processing stays true until modal closed
      } else {
        // No note -> Auto confirm
        await handleConfirm(decodedText)
      }

    } catch (error) {
      setStatus('ERROR')
      setFeedback({ message: 'Error de red o servidor', type: 'error' })
      setTimeout(() => handleReset(), 3000)
    }
  }, [lastScannedToken, status, handleReset]) // Removed handleConfirm from deps to avoid circular dep if not careful, but handleConfirm is stable-ish

  // Manual submit handler
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (qrToken.trim()) {
      handleScan(qrToken.trim())
    }
  }

  useEffect(() => {
    // Initialize Scanner
    // We use a div id "reader"
    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true
      },
        /* verbose= */ false
    )

    scanner.render(handleScan, (_errorMessage) => {
      // ignore errors during scanning usually
      // console.log(errorMessage)
    })

    scannerRef.current = scanner

    return () => {
      scanner.clear().catch(error => {
        console.error("Failed to clear html5-qrcode scanner. ", error)
      })
    }
  }, [handleScan])


  return (
    <div className="scanner-container" style={{ padding: '1rem', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Scanner de Accesos</h2>

      <div id="reader" style={{ width: '100%', marginBottom: '1rem' }}></div>

      <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          type="text"
          value={qrToken}
          onChange={e => setQrToken(e.target.value)}
          placeholder="Código manual..."
          className="form-control"
          style={{ flex: 1, padding: '0.5rem' }}
          disabled={status !== 'IDLE'}
          data-testid="scanner-input"
        />
        <button type="submit" disabled={status !== 'IDLE' || !qrToken} style={{ padding: '0.5rem 1rem' }} data-testid="validate-btn">
          Validar
        </button>
      </form>

      {/* Feedback Area */}
      {feedback && (
        <div className={`feedback-card feedback-${feedback.type}`}
          style={{
            padding: '1rem',
            borderRadius: '8px',
            backgroundColor: feedback.type === 'success' ? '#d4edda' : feedback.type === 'error' ? '#f8d7da' : feedback.type === 'warning' ? '#fff3cd' : '#e2e3e5',
            color: feedback.type === 'success' ? '#155724' : feedback.type === 'error' ? '#721c24' : feedback.type === 'warning' ? '#856404' : '#383d41',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
          <h3 style={{ margin: 0 }}>{feedback.message}</h3>
        </div>
      )}

      {/* Ticket Info Card */}
      {ticketData && (
        <div className="ticket-info" style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
          <h4>{ticketData.displayLabel}</h4>
          <p>Estado: <strong>{ticketData.status === 'SCANNED' ? 'Escaneado' : ticketData.status === 'PENDING' ? 'Pendiente' : ticketData.status}</strong></p>
          <p>Tipo: {ticketData.guestType}</p>
          {ticketData.scannedAt && <p>Escaneado: {new Date(ticketData.scannedAt).toLocaleTimeString()}</p>}
        </div>
      )}

      {/* Note Modal */}
      <Modal
        isOpen={showNoteModal}
        onClose={() => {
          setShowNoteModal(false)
          setPendingNoteToken(null)
          handleReset() // Cancelled
        }}
        title="Nota en el Ticket"
      >
        <div style={{ padding: '1rem 0' }}>
          <div style={{ backgroundColor: '#fff3cd', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
            <strong>Nota:</strong> {ticketData?.note}
          </div>

          <p>¿Permitir acceso a este invitado?</p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                setShowNoteModal(false)
                setPendingNoteToken(null)
                handleReset() // Reject/Cancel
              }}
              style={{ padding: '0.5rem 1rem', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Rechazar / Cancelar
            </button>
            <button
              onClick={() => {
                if (pendingNoteToken) {
                  handleConfirm(pendingNoteToken)
                }
                setShowNoteModal(false)
                setPendingNoteToken(null)
              }}
              style={{ padding: '0.5rem 1rem', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              data-testid="confirm-btn"
            >
              Permitir Acceso
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
