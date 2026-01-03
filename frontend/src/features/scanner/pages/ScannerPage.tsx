import { useState } from 'react'
import { scannerApi, type ScannerValidateResponse } from '../api'

export function ScannerPage() {
  const [qrToken, setQrToken] = useState('')
  const [lastValidatedToken, setLastValidatedToken] = useState('')
  const [state, setState] = useState<{ validation: ScannerValidateResponse | null; error?: string | null }>({
    validation: null,
  })
  const [isValidating, setIsValidating] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)

  const canConfirm =
    state.validation?.ticket && state.validation.valid && state.validation.ticket.status === 'PENDING' && !isConfirming

  const handleValidate = async () => {
    if (!qrToken.trim()) return
    setIsValidating(true)
    setIsConfirming(false)
    try {
      const response = await scannerApi.validate({ qrToken: qrToken.trim() })
      setState({ validation: response, error: null })
      setLastValidatedToken(qrToken.trim())
    } catch (error) {
      setState({ validation: null, error: (error as Error).message ?? 'No se pudo validar el QR' })
    } finally {
      setIsValidating(false)
    }
  }

  const handleConfirm = async () => {
    if (!state.validation?.ticket || !lastValidatedToken) return
    setIsConfirming(true)
    try {
      const clientRequestId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2)
      const response = await scannerApi.confirm({
        qrToken: lastValidatedToken,
        clientRequestId,
      })
      setState({
        validation: {
          valid: response.confirmed,
          reason: response.reason,
          ticket: response.ticket,
        },
        error: null,
      })
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: (error as Error).message ?? 'No se pudo confirmar la entrada',
      }))
    } finally {
      setIsConfirming(false)
    }
  }

  const validation = state.validation
  const resultVariant = !validation ? 'idle' : validation.valid && validation.ticket?.status === 'PENDING' ? 'ready' : validation.ticket?.status === 'SCANNED' ? 'scanned' : 'invalid'

  return (
    <div className="scanner-screen">
      <div>
        <h3 style={{ marginTop: 0 }}>Scanner operativo</h3>
        <p style={{ marginTop: 0 }} className="text-muted">
          Alta visibilidad para la puerta. Verde = listo, rojo = invalido.
        </p>
      </div>
      <div className="scanner-form">
        <input
          value={qrToken}
          onChange={(e) => setQrToken(e.target.value)}
          placeholder="Pega o escanea token opaco"
          data-testid="scanner-input"
        />
        <button type="button" onClick={handleValidate} disabled={isValidating || !qrToken.trim()} data-testid="validate-btn">
          {isValidating ? 'Validando...' : 'Validar'}
        </button>
        <button type="button" onClick={handleConfirm} disabled={!canConfirm} data-testid="confirm-btn">
          {isConfirming ? 'Confirmando...' : 'Confirmar'}
        </button>
      </div>

      {state.error ? <p className="text-danger">{state.error}</p> : null}

      {validation ? (
        <section
          className={`scanner-result ${resultVariant === 'ready' ? 'scanner-result--valid' : resultVariant === 'invalid' ? 'scanner-result--invalid' : ''}`}
        >
          {validation.ticket ? (
            <div>
              <h4 style={{ margin: '0 0 0.5rem' }}>{validation.ticket.displayLabel}</h4>
              <p style={{ margin: '0.25rem 0' }}>Nota: {validation.ticket.note ?? 'Sin nota'}</p>
              <p style={{ margin: '0.25rem 0' }}>Estado: {validation.ticket.status === 'SCANNED' ? 'Escaneado' : 'Pendiente'}</p>
              {validation.ticket.scannedAt ? (
                <p style={{ margin: '0.25rem 0' }}>Escaneado: {new Date(validation.ticket.scannedAt).toLocaleString()}</p>
              ) : null}
            </div>
          ) : (
            <p>Ticket no encontrado.</p>
          )}
          {!validation.valid && validation.reason ? (
            <p className="text-danger">
              Resultado: {validation.reason === 'ALREADY_SCANNED' ? 'Ya escaneado' : 'Token invalido'}
            </p>
          ) : null}
          {resultVariant === 'ready' ? <p className="text-success">Listo para confirmar.</p> : null}
        </section>
      ) : null}
    </div>
  )
}
