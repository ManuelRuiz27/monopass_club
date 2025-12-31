import { useState } from 'react'
import { scannerApi, type ScannerValidateResponse } from '../api'

type ScanState = {
  validation: ScannerValidateResponse | null
  error?: string | null
}

export function ScannerPage() {
  const [qrToken, setQrToken] = useState('')
  const [lastValidatedToken, setLastValidatedToken] = useState('')
  const [state, setState] = useState<ScanState>({ validation: null })
  const [isValidating, setIsValidating] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)

  const canConfirm =
    state.validation?.ticket &&
    state.validation.valid &&
    state.validation.ticket.status === 'PENDING' &&
    !isConfirming

  const handleValidate = async () => {
    if (!qrToken.trim()) return
    setIsValidating(true)
    setIsConfirming(false)
    try {
      const response = await scannerApi.validate({ qrToken: qrToken.trim() })
      setState({ validation: response, error: null })
      setLastValidatedToken(qrToken.trim())
    } catch (error) {
      setState({
        validation: null,
        error: (error as Error).message ?? 'No se pudo validar el QR',
      })
    } finally {
      setIsValidating(false)
    }
  }

  const handleConfirm = async () => {
    if (!state.validation?.ticket || !lastValidatedToken) return
    setIsConfirming(true)
    try {
      const clientRequestId =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
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

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Scanner operativo</h3>
      <p style={{ marginTop: 0, color: '#475569' }}>
        Ingresa manualmente el QR token para validar y confirmar entradas. La UI oculta Confirmar cuando el ticket no es valido.
      </p>
      <div className="form-grid" style={{ maxWidth: 480 }}>
        <label>
          QR Token
          <input
            value={qrToken}
            onChange={(e) => setQrToken(e.target.value)}
            placeholder="Pega un token opaco"
            data-testid="scanner-input"
          />
        </label>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="button" onClick={handleValidate} disabled={isValidating || !qrToken.trim()} data-testid="validate-btn">
            {isValidating ? 'Validando...' : 'Validar'}
          </button>
          <button type="button" onClick={handleConfirm} disabled={!canConfirm} data-testid="confirm-btn">
            {isConfirming ? 'Confirmando...' : 'Confirmar entrada'}
          </button>
        </div>
      </div>

      {state.error ? <p style={{ color: '#b91c1c' }}>{state.error}</p> : null}

      {validation ? (
        <section className="card" style={{ marginTop: '1.5rem' }}>
          <header style={{ marginBottom: '0.5rem' }}>
            <strong>Resultado</strong>
          </header>
          {validation.ticket ? (
            <div>
              <p style={{ margin: '0.25rem 0' }}>
                <strong>Tipo:</strong> {validation.ticket.displayLabel}
              </p>
              <p style={{ margin: '0.25rem 0' }}>
                <strong>Nota:</strong> {validation.ticket.note ?? 'Sin nota'}
              </p>
              <p style={{ margin: '0.25rem 0' }}>
                <strong>Estado:</strong>{' '}
                <span className="badge">{validation.ticket.status === 'SCANNED' ? 'Escaneado' : 'Pendiente'}</span>
              </p>
              {validation.ticket.scannedAt ? (
                <p style={{ margin: '0.25rem 0' }}>
                  <strong>Escaneado:</strong> {new Date(validation.ticket.scannedAt).toLocaleString()}
                </p>
              ) : null}
            </div>
          ) : (
            <p>Ticket no encontrado.</p>
          )}
          {!validation.valid && validation.reason ? (
            <p style={{ color: '#b91c1c' }}>
              Resultado: {validation.reason === 'ALREADY_SCANNED' ? 'Ya escaneado' : 'Token invalido'}
            </p>
          ) : null}
          {canConfirm ? (
            <p style={{ marginTop: '0.5rem', color: '#16a34a' }}>Listo para confirmar.</p>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
