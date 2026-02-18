import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { gsap } from 'gsap'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { scannerApi, type ScannerValidateResponse } from '../api'
import { Button } from '@/components/ui'
import { useGsapInteractiveScale } from '@/lib/motion/useGsapInteractiveScale'
import { usePrefersReducedMotion } from '@/lib/motion/usePrefersReducedMotion'

type ScannerStatus = 'SCANNING' | 'VALIDATING' | 'CONFIRMING' | 'REVIEW_NOTE' | 'SUCCESS' | 'INVALID'
type SystemIssue = 'OFFLINE' | 'NO_PERMISSION' | 'NO_CAMERA' | 'NETWORK'

type FeedbackTone = 'neutral' | 'success' | 'error' | 'warning'
type Feedback = {
  title: string
  message?: string
  tone: FeedbackTone
}

const RESET_DELAY_MS = 2600

function systemIssueCopy(issue: SystemIssue): { title: string; description: string } {
  switch (issue) {
    case 'OFFLINE':
      return {
        title: 'Sin conexion',
        description: 'Verifica tu internet y vuelve a intentar.',
      }
    case 'NO_PERMISSION':
      return {
        title: 'Sin acceso a la camara',
        description: 'Habilita permisos de camara en el navegador para continuar.',
      }
    case 'NO_CAMERA':
      return {
        title: 'Camara no disponible',
        description: 'No detectamos camara en este dispositivo.',
      }
    case 'NETWORK':
      return {
        title: 'Error de red',
        description: 'No se pudo contactar al servidor de validacion.',
      }
  }
}

export function ScannerPage() {
  const [qrToken, setQrToken] = useState('')
  const [lastScannedToken, setLastScannedToken] = useState<string | null>(null)
  const [status, setStatus] = useState<ScannerStatus>('SCANNING')
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [ticketData, setTicketData] = useState<ScannerValidateResponse['ticket'] | null>(null)
  const [pendingNoteToken, setPendingNoteToken] = useState<string | null>(null)
  const [systemIssue, setSystemIssue] = useState<SystemIssue | null>(null)
  const prefersReducedMotion = usePrefersReducedMotion()

  const stageRef = useRef<HTMLElement | null>(null)
  const beamRef = useRef<HTMLDivElement | null>(null)
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const overlayCardRef = useRef<HTMLDivElement | null>(null)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const isProcessingRef = useRef(false)
  const isPausedRef = useRef(false)
  const resetTimeoutRef = useRef<number | null>(null)

  const clearPendingReset = useCallback(() => {
    if (resetTimeoutRef.current) {
      window.clearTimeout(resetTimeoutRef.current)
      resetTimeoutRef.current = null
    }
  }, [])

  const scheduleReset = useCallback(
    (delay = RESET_DELAY_MS) => {
      clearPendingReset()
      resetTimeoutRef.current = window.setTimeout(() => {
        setStatus('SCANNING')
        setFeedback(null)
        setTicketData(null)
        setPendingNoteToken(null)
        setQrToken('')
        isProcessingRef.current = false

        if (scannerRef.current && isPausedRef.current) {
          try {
            scannerRef.current.resume()
            isPausedRef.current = false
          } catch {
            isPausedRef.current = false
          }
        }
      }, delay)
    },
    [clearPendingReset],
  )

  const pauseScanner = useCallback(() => {
    if (!scannerRef.current) return
    try {
      scannerRef.current.pause()
      isPausedRef.current = true
    } catch {
      // ignore scanner runtime pause errors
    }
  }, [])

  const probeSystem = useCallback(async (): Promise<boolean> => {
    if (!navigator.onLine) {
      setSystemIssue('OFFLINE')
      return false
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setSystemIssue('NO_CAMERA')
      return false
    }

    try {
      const permissionsApi = navigator.permissions
      if (permissionsApi && typeof permissionsApi.query === 'function') {
        const permission = await permissionsApi.query({ name: 'camera' as PermissionName })
        if (permission.state === 'denied') {
          setSystemIssue('NO_PERMISSION')
          return false
        }
      }
    } catch {
      // permissions API may be unavailable in some browsers
    }

    setSystemIssue(null)
    return true
  }, [])

  const handleConfirm = useCallback(
    async (token: string) => {
      setStatus('CONFIRMING')
      setFeedback({ title: 'Confirmando entrada...', tone: 'neutral' })

      try {
        const clientRequestId = crypto.randomUUID()
        const response = await scannerApi.confirm({ qrToken: token, clientRequestId })

        if (response.confirmed) {
          setStatus('SUCCESS')
          setFeedback({
            title: 'Acceso valido',
            message: 'Entrada confirmada correctamente.',
            tone: 'success',
          })
          setTicketData(response.ticket)
          scheduleReset()
          return
        }

        setStatus('INVALID')
        setFeedback({
          title: 'Acceso invalido',
          message: response.reason === 'ALREADY_SCANNED' ? 'Este ticket ya fue utilizado.' : 'No fue posible confirmar.',
          tone: 'error',
        })
        isProcessingRef.current = false
        scheduleReset()
      } catch {
        setSystemIssue('NETWORK')
        isProcessingRef.current = false
      }
    },
    [scheduleReset],
  )

  const handleScan = useCallback(
    async (decodedText: string) => {
      if (isProcessingRef.current || systemIssue) return
      if (decodedText === lastScannedToken && status !== 'SCANNING') return

      isProcessingRef.current = true
      clearPendingReset()
      setLastScannedToken(decodedText)
      setQrToken(decodedText)
      setStatus('VALIDATING')
      setFeedback({ title: 'Validando acceso...', tone: 'neutral' })
      pauseScanner()

      try {
        const response = await scannerApi.validate({ qrToken: decodedText })

        if (!response.valid) {
          setStatus('INVALID')
          setFeedback({
            title: 'Acceso invalido',
            message: response.reason === 'ALREADY_SCANNED' ? 'Este ticket ya fue utilizado.' : 'Token invalido.',
            tone: 'error',
          })
          setTicketData(response.ticket)
          scheduleReset()
          return
        }

        const ticket = response.ticket
        setTicketData(ticket)

        if (ticket?.status === 'SCANNED') {
          setStatus('INVALID')
          setFeedback({
            title: 'Acceso invalido',
            message: 'Este ticket ya fue escaneado.',
            tone: 'warning',
          })
          scheduleReset()
          return
        }

        if (ticket?.note) {
          setPendingNoteToken(decodedText)
          setStatus('REVIEW_NOTE')
          setFeedback({
            title: 'Acceso valido con nota',
            message: 'Revisa la nota antes de confirmar.',
            tone: 'warning',
          })
          return
        }

        await handleConfirm(decodedText)
      } catch {
        setSystemIssue('NETWORK')
      }
    },
    [clearPendingReset, handleConfirm, lastScannedToken, pauseScanner, scheduleReset, status, systemIssue],
  )

  const handleManualSubmit = (event: FormEvent) => {
    event.preventDefault()
    const manualToken = qrToken.trim()
    if (!manualToken || status !== 'SCANNING' || systemIssue) return
    void handleScan(manualToken)
  }

  useEffect(() => {
    const onOnline = () => {
      void probeSystem()
    }

    const onOffline = () => {
      setSystemIssue('OFFLINE')
    }

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    queueMicrotask(() => {
      void probeSystem()
    })

    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [probeSystem])

  useEffect(() => {
    if (systemIssue) return

    const scanner = new Html5QrcodeScanner(
      'reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
      },
      false,
    )

    scanner.render(
      (decodedText) => {
        void handleScan(decodedText)
      },
      (scanErrorMessage) => {
        const message = scanErrorMessage.toLowerCase()
        if (message.includes('permission') || message.includes('notallowed')) {
          setSystemIssue('NO_PERMISSION')
        } else if (message.includes('camera') || message.includes('device')) {
          setSystemIssue('NO_CAMERA')
        }
      },
    )

    scannerRef.current = scanner

    return () => {
      clearPendingReset()
      scanner
        .clear()
        .catch(() => {
          // ignore scanner teardown errors
        })
      scannerRef.current = null
      isPausedRef.current = false
    }
  }, [clearPendingReset, handleScan, systemIssue])

  const handleRetrySystem = async () => {
    const healthy = await probeSystem()
    if (!healthy) return
    setStatus('SCANNING')
    setFeedback(null)
    setPendingNoteToken(null)
    setTicketData(null)
    isProcessingRef.current = false
  }

  const handleRejectNote = () => {
    setStatus('INVALID')
    setFeedback({
      title: 'Acceso rechazado',
      message: 'Escaneo descartado por el staff.',
      tone: 'warning',
    })
    scheduleReset(1600)
  }

  const currentTone = feedback?.tone ?? 'neutral'
  const issueCopy = systemIssue ? systemIssueCopy(systemIssue) : null

  useGsapInteractiveScale(stageRef, '.scanner-overlay .ui-btn, .scanner-stage__manual .ui-btn', status, {
    hoverScale: 1.01,
    pressScale: 0.98,
  })

  useLayoutEffect(() => {
    if (prefersReducedMotion) return

    const scope = stageRef.current
    if (!scope) return

    const context = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: 'power2.out' } })
      timeline
        .fromTo(
          '[data-gsap-scan-header]',
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.24, clearProps: 'opacity,transform' },
        )
        .fromTo(
          '[data-gsap-scan-viewport]',
          { autoAlpha: 0, scale: 0.98 },
          { autoAlpha: 1, scale: 1, duration: 0.3, clearProps: 'opacity,transform' },
          '-=0.12',
        )
        .fromTo(
          '[data-gsap-scan-footer]',
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.24, clearProps: 'opacity,transform' },
          '-=0.14',
        )
    }, scope)

    return () => context.revert()
  }, [prefersReducedMotion, systemIssue])

  useLayoutEffect(() => {
    const beam = beamRef.current
    if (!beam) return

    gsap.killTweensOf(beam)

    if (prefersReducedMotion || status !== 'SCANNING' || Boolean(systemIssue)) {
      gsap.set(beam, { autoAlpha: 0 })
      return
    }

    const tween = gsap.fromTo(
      beam,
      { autoAlpha: 0.16, yPercent: -120 },
      {
        autoAlpha: 0.9,
        yPercent: 120,
        duration: 1.2,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      },
    )

    return () => {
      tween.kill()
    }
  }, [prefersReducedMotion, status, systemIssue])

  useLayoutEffect(() => {
    if (prefersReducedMotion || status === 'SCANNING' || !feedback) return

    const overlay = overlayRef.current
    const card = overlayCardRef.current
    if (!overlay || !card) return

    const timeline = gsap.timeline({ defaults: { ease: 'power2.out' } })
    timeline
      .fromTo(overlay, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15 })
      .fromTo(card, { autoAlpha: 0, y: 20, scale: 0.95 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.24 }, 0)

    return () => {
      timeline.kill()
    }
  }, [feedback, prefersReducedMotion, status])

  return (
    <section ref={stageRef} className="scanner-stage">
      <header className="scanner-stage__header" data-gsap-scan-header>
        <div>
          <p className="scanner-stage__brand">PassMonkey</p>
          <h2 className="scanner-stage__title">Scanner</h2>
          <p className="scanner-stage__subtitle">Apunta al codigo QR para validar el acceso.</p>
        </div>
      </header>

      {systemIssue && issueCopy ? (
        <article className="scanner-system-state">
          <h3>{issueCopy.title}</h3>
          <p>{issueCopy.description}</p>
          <Button type="button" variant="secondary" onClick={handleRetrySystem}>
            Reintentar
          </Button>
        </article>
      ) : (
        <>
          <div className="scanner-stage__viewport" data-gsap-scan-viewport>
            <div id="reader" className="scanner-stage__reader" />
            <div ref={beamRef} className="scanner-stage__scan-beam" aria-hidden="true" />

            {status !== 'SCANNING' && feedback ? (
              <div ref={overlayRef} className={`scanner-overlay scanner-overlay--${currentTone}`}>
                <div ref={overlayCardRef} className="scanner-overlay__card">
                  <h3>{feedback.title}</h3>
                  {feedback.message ? <p>{feedback.message}</p> : null}

                  {status === 'REVIEW_NOTE' ? (
                    <div className="scanner-overlay__note">
                      <p>
                        <strong>Nota del RP:</strong> {ticketData?.note}
                      </p>
                      <div className="scanner-overlay__actions">
                        <Button type="button" variant="danger" onClick={handleRejectNote}>
                          Rechazar
                        </Button>
                        <Button
                          type="button"
                          variant="success"
                          onClick={() => {
                            if (pendingNoteToken) {
                              void handleConfirm(pendingNoteToken)
                            }
                          }}
                        >
                          Confirmar entrada
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="scanner-overlay__actions">
                      <Button type="button" variant="secondary" onClick={() => scheduleReset(0)}>
                        Escanear otro
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <footer className="scanner-stage__footer" data-gsap-scan-footer>
            <p className="scanner-stage__event">Noche de Inauguracion - Club Noir</p>
            <form className="scanner-stage__manual" onSubmit={handleManualSubmit}>
              <input
                type="text"
                value={qrToken}
                onChange={(event) => setQrToken(event.target.value)}
                placeholder="Codigo manual..."
                disabled={status !== 'SCANNING'}
                data-testid="scanner-input"
              />
              <Button type="submit" size="sm" disabled={status !== 'SCANNING' || !qrToken.trim()}>
                Validar
              </Button>
            </form>
          </footer>
        </>
      )}
    </section>
  )
}
