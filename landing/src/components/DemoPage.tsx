import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  QrCode,
  RefreshCcw,
  ScanLine,
  Share2,
  Ticket,
  Undo2,
} from 'lucide-react'
import { FooterSection } from './FooterSection.tsx'
import { trackLandingEvent } from '../lib/analytics.ts'
import {
  getLandingDemoSession,
  issueLandingDemoTicket,
  resetLandingDemoSession,
  validateLandingDemoTicket,
} from '../lib/publicApi.ts'

type DemoTab = 'issue' | 'scan'
type TicketStatus = 'issued' | 'used'
type ScanTone = 'idle' | 'success' | 'warning' | 'danger'
type CameraScanStatus = 'idle' | 'starting' | 'active' | 'unsupported' | 'blocked' | 'error'
type GuestType = 'GENERAL' | 'VIP' | 'CORTESIA'

type DemoTicket = {
  id: string
  code: string
  eventName: string
  guestType: GuestType
  note: string | null
  issuedAtIso: string
  weekKey: string
  sequence: number
  status: TicketStatus
  usedAtIso: string | null
  qrPayload: string
}

type DemoStore = {
  weekKey: string
  lastSequence: number
  activeTicketId: string | null
  tickets: DemoTicket[]
}

type ScanResult = {
  tone: ScanTone
  title: string
  detail: string
  ticketId?: string
  code?: string
  scannedAtIso?: string
  scannerEngineLabel?: 'BarcodeDetector' | 'jsQR'
}

type DemoDetectedBarcode = {
  rawValue?: string
}

type DemoBarcodeDetectorInstance = {
  detect: (source: HTMLVideoElement) => Promise<DemoDetectedBarcode[]>
}

type DemoBarcodeDetectorConstructor = {
  new (options?: { formats?: string[] }): DemoBarcodeDetectorInstance
  getSupportedFormats?: () => Promise<string[]>
}

type CameraEngine = 'barcode-detector' | 'jsqr'
type DemoJsQrResult = { data: string } | null
type DemoJsQrDecodeFn = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  options?: unknown,
) => DemoJsQrResult

const WEEKLY_DEMO_LIMIT = 1000
const DEMO_EVENT_NAME = 'Demo Event'
const STORAGE_KEY = 'passmonkey_landing_demo_weekly_v1'
const DEMO_TICKET_TEMPLATE_SRC = '/assets/ticket-demo-event.png'
const DEMO_TICKET_QR_OVERLAY = {
  leftRatio: 0.672,
  topRatio: 0.279,
  widthRatio: 0.246,
}

const EMPTY_SCAN_RESULT: ScanResult = {
  tone: 'idle',
  title: 'Scanner listo',
  detail: 'Usa "Escanear ultimo QR" para validar el boleto generado en esta misma demo.',
}

function pad(num: number, size = 4) {
  return String(num).padStart(size, '0')
}

function getIsoWeekKey(date = new Date()) {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = tmp.getUTCDay() || 7
  tmp.setUTCDate(tmp.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

function hashSignature(input: string) {
  let hash = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36).toUpperCase().slice(0, 8)
}

function buildQrPayload(ticketId: string, code: string, weekKey: string) {
  const signature = hashSignature(`${weekKey}|${ticketId}|${code}|PMDEMO`)
  return `PM-DEMO|1|${weekKey}|${ticketId}|${code}|${signature}`
}

function parseQrPayload(raw: string) {
  const parts = raw.trim().split('|')
  if (parts.length !== 6) return null
  const [prefix, version, weekKey, ticketId, code, signature] = parts
  if (prefix !== 'PM-DEMO' || version !== '1') return null
  return { weekKey, ticketId, code, signature }
}

function isDemoStore(value: unknown): value is DemoStore {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<DemoStore>
  return typeof candidate.weekKey === 'string'
    && typeof candidate.lastSequence === 'number'
    && Array.isArray(candidate.tickets)
}

function createEmptyStore(currentWeekKey: string): DemoStore {
  return {
    weekKey: currentWeekKey,
    lastSequence: 0,
    activeTicketId: null,
    tickets: [],
  }
}

function readStore(): DemoStore {
  const currentWeekKey = getIsoWeekKey()
  if (typeof window === 'undefined' || !('localStorage' in window)) {
    return createEmptyStore(currentWeekKey)
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createEmptyStore(currentWeekKey)

    const parsed = JSON.parse(raw) as unknown
    if (!isDemoStore(parsed)) return createEmptyStore(currentWeekKey)
    if (parsed.weekKey !== currentWeekKey) return createEmptyStore(currentWeekKey)

    const sanitizedTickets = parsed.tickets
      .filter((ticket) => ticket && typeof ticket === 'object')
      .slice(0, WEEKLY_DEMO_LIMIT)
      .map((ticket) => {
        const t = ticket as Partial<DemoTicket>
        return {
          id: typeof t.id === 'string' ? t.id : '',
          code: typeof t.code === 'string' ? t.code : '',
          eventName: DEMO_EVENT_NAME,
          guestType: t.guestType === 'VIP' || t.guestType === 'CORTESIA' ? t.guestType : 'GENERAL',
          note: typeof t.note === 'string' ? t.note : null,
          issuedAtIso: typeof t.issuedAtIso === 'string' ? t.issuedAtIso : new Date().toISOString(),
          weekKey: typeof t.weekKey === 'string' ? t.weekKey : currentWeekKey,
          sequence: typeof t.sequence === 'number' ? t.sequence : 0,
          status: t.status === 'used' ? 'used' : 'issued',
          usedAtIso: typeof t.usedAtIso === 'string' ? t.usedAtIso : null,
          qrPayload: typeof t.qrPayload === 'string' ? t.qrPayload : '',
        } satisfies DemoTicket
      })
      .filter((ticket) => ticket.id && ticket.code)

    return {
      weekKey: currentWeekKey,
      lastSequence: Math.max(parsed.lastSequence, sanitizedTickets.length),
      activeTicketId: typeof parsed.activeTicketId === 'string' ? parsed.activeTicketId : null,
      tickets: sanitizedTickets,
    }
  } catch {
    return createEmptyStore(currentWeekKey)
  }
}

function writeStore(store: DemoStore) {
  if (typeof window === 'undefined' || !('localStorage' in window)) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // Ignore storage errors so the demo still renders in private mode / restricted browsers.
  }
}

function formatLocalDateTime(iso: string) {
  const date = new Date(iso)
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function getScanToneClass(tone: ScanTone) {
  if (tone === 'success') return 'pm-demo-scan-result pm-demo-scan-result--success'
  if (tone === 'warning') return 'pm-demo-scan-result pm-demo-scan-result--warning'
  if (tone === 'danger') return 'pm-demo-scan-result pm-demo-scan-result--danger'
  return 'pm-demo-scan-result'
}

function getBarcodeDetectorCtor() {
  if (typeof window === 'undefined') return null
  const maybeWindow = window as Window & { BarcodeDetector?: DemoBarcodeDetectorConstructor }
  return maybeWindow.BarcodeDetector ?? null
}

function loadImageElement(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`No se pudo cargar imagen: ${src}`))
    image.src = src
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/png') {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type)
  })
}

async function buildDemoTicketShareImage(qrDataUrl: string) {
  const [baseImage, qrImage] = await Promise.all([
    loadImageElement(DEMO_TICKET_TEMPLATE_SRC),
    loadImageElement(qrDataUrl),
  ])

  const width = baseImage.naturalWidth || baseImage.width
  const height = baseImage.naturalHeight || baseImage.height
  if (!width || !height) return null

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.drawImage(baseImage, 0, 0, width, height)

  const qrWidth = width * DEMO_TICKET_QR_OVERLAY.widthRatio
  const qrHeight = qrWidth
  const qrX = width * DEMO_TICKET_QR_OVERLAY.leftRatio
  const qrY = height * DEMO_TICKET_QR_OVERLAY.topRatio
  ctx.drawImage(qrImage, qrX, qrY, qrWidth, qrHeight)

  return canvasToBlob(canvas)
}

function downloadBlobFile(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}

const PUBLIC_DEMO_SESSION_ID = 'public-demo'

export function DemoPage() {
  const [demoSessionId] = useState(() => PUBLIC_DEMO_SESSION_ID)
  const [demoSessionMode, setDemoSessionMode] = useState<'unknown' | 'remote' | 'local'>('unknown')
  const [activeTab, setActiveTab] = useState<DemoTab>('issue')
  const [store, setStore] = useState<DemoStore>(() => readStore())
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [isGeneratingTicket, setIsGeneratingTicket] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult>(EMPTY_SCAN_RESULT)
  const [cameraStatus, setCameraStatus] = useState<CameraScanStatus>('idle')
  const [cameraMessage, setCameraMessage] = useState(
    'Opcional: usa la camara del dispositivo para leer el QR del ticket en pantalla o desde otro celular.',
  )
  const [cameraEngineLabel, setCameraEngineLabel] = useState<'BarcodeDetector' | 'jsQR' | null>(null)
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment')
  const [shareCooldownUntilTs, setShareCooldownUntilTs] = useState<number | null>(null)
  const [cooldownNowTs, setCooldownNowTs] = useState<number>(() => Date.now())
  const [lastSharedTicketId, setLastSharedTicketId] = useState<string | null>(null)
  const [issueGuestType, setIssueGuestType] = useState<GuestType>('GENERAL')
  const [issueNote, setIssueNote] = useState('')

  const cameraVideoRef = useRef<HTMLVideoElement | null>(null)
  const cameraStreamRef = useRef<MediaStream | null>(null)
  const cameraRafRef = useRef<number | null>(null)
  const detectorRef = useRef<DemoBarcodeDetectorInstance | null>(null)
  const jsQrRef = useRef<DemoJsQrDecodeFn | null>(null)
  const cameraEngineRef = useRef<CameraEngine | null>(null)
  const cameraCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const cameraCanvasCtxRef = useRef<CanvasRenderingContext2D | null>(null)
  const detectInFlightRef = useRef(false)
  const cameraRunningRef = useRef(false)
  const lastDetectedValueRef = useRef<string | null>(null)
  const lastDetectedAtRef = useRef<number>(0)
  const continuousCameraScanRef = useRef(false)

  const activeTicket = store.tickets.find((ticket) => ticket.id === store.activeTicketId) ?? null
  const remainingThisWeek = Math.max(0, WEEKLY_DEMO_LIMIT - store.tickets.length)
  const shareCooldownRemainingMs = shareCooldownUntilTs ? Math.max(0, shareCooldownUntilTs - cooldownNowTs) : 0
  const shareCooldownSeconds = Math.ceil(shareCooldownRemainingMs / 1000)
  const isShareCooldownActive = shareCooldownRemainingMs > 0
  const isActiveTicketSharedAndLocked = Boolean(activeTicket && lastSharedTicketId === activeTicket.id && isShareCooldownActive)

  useEffect(() => {
    let cancelled = false

    async function loadSharedSession() {
      try {
        const response = await getLandingDemoSession(demoSessionId)
        if (cancelled) return
        setStore(response.store as DemoStore)
        setDemoSessionMode('remote')
      } catch {
        if (cancelled) return
        setDemoSessionMode('local')
      }
    }

    void loadSharedSession()
    return () => {
      cancelled = true
    }
  }, [demoSessionId])

  useEffect(() => {
    if (demoSessionMode === 'remote') return
    writeStore(store)
  }, [demoSessionMode, store])

  useEffect(() => {
    if (!shareCooldownUntilTs) return
    if (shareCooldownUntilTs <= Date.now()) {
      setCooldownNowTs(Date.now())
      return
    }

    const timer = window.setInterval(() => {
      setCooldownNowTs(Date.now())
    }, 250)

    return () => window.clearInterval(timer)
  }, [shareCooldownUntilTs])

  useEffect(() => {
    if (!shareCooldownUntilTs) return
    if (cooldownNowTs >= shareCooldownUntilTs) {
      setShareCooldownUntilTs(null)
    }
  }, [cooldownNowTs, shareCooldownUntilTs])

  useEffect(() => {
    if (cameraStatus !== 'active') return
    void startCameraMode({ forceRestart: true })
  }, [cameraFacingMode])

  useEffect(() => {
    let cancelled = false

    async function generateQr() {
      if (!activeTicket) {
        setQrDataUrl('')
        return
      }

      try {
        const qrModule = await import('qrcode')
        const qrApi = 'default' in qrModule ? qrModule.default : qrModule
        const dataUrl = await qrApi.toDataURL(activeTicket.qrPayload, {
          width: 420,
          margin: 1,
          errorCorrectionLevel: 'M',
          color: {
            dark: '#08173a',
            light: '#ffffff',
          },
        })
        if (!cancelled) setQrDataUrl(dataUrl)
      } catch {
        if (!cancelled) setQrDataUrl('')
      }
    }

    void generateQr()

    return () => {
      cancelled = true
    }
  }, [activeTicket])

  useEffect(() => {
    if (activeTab !== 'scan') {
      stopCameraMode()
    }

    return () => {
      stopCameraMode()
    }
  }, [activeTab])

  async function generateTicket() {
    if (isGeneratingTicket || remainingThisWeek <= 0) return
    setIsGeneratingTicket(true)

    if (demoSessionMode !== 'local') {
      try {
        const response = await issueLandingDemoTicket(demoSessionId, {
          guestType: issueGuestType,
          note: issueNote.trim() || undefined,
        })
        setStore(response.store as DemoStore)
        setScanResult(EMPTY_SCAN_RESULT)
        setIssueNote('')
        setDemoSessionMode('remote')
        setIsGeneratingTicket(false)
        return
      } catch {
        if (demoSessionMode === 'remote') {
          setIsGeneratingTicket(false)
          setScanResult({
            tone: 'danger',
            title: 'No se pudo generar',
            detail: 'Fallo la sincronizacion de la demo compartida. Intenta de nuevo.',
            scannedAtIso: new Date().toISOString(),
          })
          return
        }
        setDemoSessionMode('local')
      }
    }

    window.setTimeout(() => {
      setStore((prev) => {
        if (prev.tickets.length >= WEEKLY_DEMO_LIMIT) return prev

        const nextSequence = prev.lastSequence + 1
        const shortWeek = prev.weekKey.replace('-', '').replace('W', '')
        const ticketId = `demo-${shortWeek}-${pad(nextSequence)}`
        const codeCore = `${shortWeek.slice(-4)}${pad(nextSequence)}`
        const code = `DM${codeCore}${hashSignature(ticketId).slice(0, 2)}`
        const qrPayload = buildQrPayload(ticketId, code, prev.weekKey)

        const newTicket: DemoTicket = {
          id: ticketId,
          code,
          eventName: DEMO_EVENT_NAME,
          guestType: issueGuestType,
          note: issueNote.trim() ? issueNote.trim() : null,
          issuedAtIso: new Date().toISOString(),
          weekKey: prev.weekKey,
          sequence: nextSequence,
          status: 'issued',
          usedAtIso: null,
          qrPayload,
        }

        return {
          ...prev,
          lastSequence: nextSequence,
          activeTicketId: newTicket.id,
          tickets: [newTicket, ...prev.tickets].slice(0, WEEKLY_DEMO_LIMIT),
        }
      })

      setScanResult(EMPTY_SCAN_RESULT)
      setIssueNote('')
      setIsGeneratingTicket(false)
    }, 380)
  }

  function stopCameraMode(options?: { nextStatus?: CameraScanStatus; message?: string }) {
    cameraRunningRef.current = false

    if (cameraRafRef.current !== null) {
      window.cancelAnimationFrame(cameraRafRef.current)
      cameraRafRef.current = null
    }

    detectInFlightRef.current = false
    detectorRef.current = null
    jsQrRef.current = null
    cameraEngineRef.current = null
    cameraCanvasCtxRef.current = null

    const stream = cameraStreamRef.current
    if (stream) {
      for (const track of stream.getTracks()) {
        track.stop()
      }
      cameraStreamRef.current = null
    }

    const video = cameraVideoRef.current
    if (video) {
      try {
        video.pause()
      } catch {
        // no-op
      }
      video.srcObject = null
    }

    if (options?.nextStatus) setCameraStatus(options.nextStatus)
    else setCameraStatus('idle')
    if (options?.message) setCameraMessage(options.message)
    if (!options?.nextStatus || options.nextStatus === 'idle') setCameraEngineLabel(null)
  }

  function shouldSkipDuplicateCameraScan(rawValue: string) {
    const now = Date.now()
    if (lastDetectedValueRef.current === rawValue && now - lastDetectedAtRef.current < 1500) {
      return true
    }
    lastDetectedValueRef.current = rawValue
    lastDetectedAtRef.current = now
    return false
  }

  function handleCameraDetectedQr(rawValue: string) {
    if (shouldSkipDuplicateCameraScan(rawValue)) return

    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(18)
      } catch {
        // no-op
      }
    }

    void validateScan(rawValue, cameraEngineLabel ?? undefined)

    if (continuousCameraScanRef.current) {
      setCameraMessage(
        `QR detectado y validado (${cameraEngineLabel ?? 'camara'}). Escaneo continuo activo.`,
      )
      return
    }

    stopCameraMode({ nextStatus: 'idle', message: 'QR detectado. Camara detenida automaticamente.' })
  }

  async function detectQrFromVideoFrame(video: HTMLVideoElement) {
    const engine = cameraEngineRef.current
    if (engine === 'barcode-detector') {
      const detector = detectorRef.current
      if (!detector) return null
      const results = await detector.detect(video)
      return results.find((item) => typeof item.rawValue === 'string' && item.rawValue.trim())?.rawValue?.trim() ?? null
    }

    if (engine === 'jsqr') {
      const jsQr = jsQrRef.current
      if (!jsQr) return null

      const width = video.videoWidth
      const height = video.videoHeight
      if (!width || !height) return null

      let canvas = cameraCanvasRef.current
      if (!canvas) {
        canvas = document.createElement('canvas')
        cameraCanvasRef.current = canvas
      }

      const targetWidth = Math.min(720, width)
      const targetHeight = Math.round((height / width) * targetWidth)
      if (canvas.width !== targetWidth) canvas.width = targetWidth
      if (canvas.height !== targetHeight) canvas.height = targetHeight

      let ctx = cameraCanvasCtxRef.current
      if (!ctx) {
        ctx = canvas.getContext('2d')
        cameraCanvasCtxRef.current = ctx
      }
      if (!ctx) return null

      ctx.drawImage(video, 0, 0, targetWidth, targetHeight)
      const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight)
      const decoded = jsQr(imageData.data, targetWidth, targetHeight, { inversionAttempts: 'attemptBoth' })
      return typeof decoded?.data === 'string' && decoded.data.trim() ? decoded.data.trim() : null
    }

    return null
  }

  async function startCameraMode(options?: { forceRestart?: boolean }) {
    if (options?.forceRestart && (cameraStatus === 'active' || cameraStatus === 'starting')) {
      stopCameraMode({ nextStatus: 'idle', message: 'Reiniciando camara con la seleccion actual...' })
    }

    if (!options?.forceRestart && (cameraStatus === 'starting' || cameraStatus === 'active')) return

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus('unsupported')
      setCameraMessage('No hay acceso a getUserMedia en este navegador/contexto.')
      return
    }

    setCameraStatus('starting')
    setCameraMessage('Solicitando permiso de camara...')

    try {
      const BarcodeCtor = getBarcodeDetectorCtor()
      let selectedEngine: CameraEngine | null = null

      if (BarcodeCtor) {
        let qrSupported = true
        if (typeof BarcodeCtor.getSupportedFormats === 'function') {
          const supportedFormats = await BarcodeCtor.getSupportedFormats()
          qrSupported = supportedFormats.includes('qr_code')
        }
        if (qrSupported) {
          detectorRef.current = new BarcodeCtor({ formats: ['qr_code'] })
          cameraEngineRef.current = 'barcode-detector'
          setCameraEngineLabel('BarcodeDetector')
          selectedEngine = 'barcode-detector'
        }
      }

      if (!selectedEngine) {
        const jsQrModule = await import('jsqr')
        const jsQrMaybe = 'default' in jsQrModule ? jsQrModule.default : jsQrModule
        if (typeof jsQrMaybe !== 'function') {
          setCameraStatus('unsupported')
          setCameraMessage('No se pudo cargar el lector QR fallback (jsQR). Usa el scanner demo manual.')
          setCameraEngineLabel(null)
          return
        }
        jsQrRef.current = jsQrMaybe as DemoJsQrDecodeFn
        cameraEngineRef.current = 'jsqr'
        setCameraEngineLabel('jsQR')
        selectedEngine = 'jsqr'
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: cameraFacingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      const video = cameraVideoRef.current
      if (!video) {
        for (const track of stream.getTracks()) track.stop()
        setCameraStatus('error')
        setCameraMessage('No se pudo inicializar el preview de camara.')
        return
      }

      cameraStreamRef.current = stream
      video.srcObject = stream
      video.muted = true
      video.playsInline = true
      await video.play()

      lastDetectedValueRef.current = null
      lastDetectedAtRef.current = 0
      cameraRunningRef.current = true
      setCameraStatus('active')
      setCameraMessage(
        `Camara activa (${selectedEngine === 'barcode-detector' ? 'BarcodeDetector' : 'jsQR'}). Apunta al QR del ticket demo para validar.`,
      )

      const detectLoop = async () => {
        if (!cameraRunningRef.current) return

        const activeVideo = cameraVideoRef.current
        if (!activeVideo || activeVideo.readyState < 2) {
          cameraRafRef.current = window.requestAnimationFrame(() => {
            void detectLoop()
          })
          return
        }

        if (detectInFlightRef.current) {
          cameraRafRef.current = window.requestAnimationFrame(() => {
            void detectLoop()
          })
          return
        }

        detectInFlightRef.current = true

        try {
          const rawValue = await detectQrFromVideoFrame(activeVideo)
          if (rawValue) {
            handleCameraDetectedQr(rawValue)
            if (!cameraRunningRef.current) return
          }
        } catch {
          setCameraMessage('Camara activa. Si no detecta QR, usa el scanner demo manual como fallback.')
        } finally {
          detectInFlightRef.current = false
        }

        if (!cameraRunningRef.current) return
        cameraRafRef.current = window.requestAnimationFrame(() => {
          void detectLoop()
        })
      }

      cameraRafRef.current = window.requestAnimationFrame(() => {
        void detectLoop()
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      const isPermissionIssue = /denied|permission|notallowed/i.test(message)
      stopCameraMode({
        nextStatus: isPermissionIssue ? 'blocked' : 'error',
        message: isPermissionIssue
          ? 'Permiso de camara denegado. Usa el scanner demo manual.'
          : `No se pudo iniciar la camara (${message}).`,
      })
    }
  }

  async function validateScan(rawPayload: string, scannerEngineLabel?: 'BarcodeDetector' | 'jsQR') {
    const scannedAtIso = new Date().toISOString()
    const parsed = parseQrPayload(rawPayload)
    if (!parsed) {
      setScanResult({
        tone: 'danger',
        title: 'Boleto invalido',
        detail: 'El QR no tiene formato de Pass Monkey Demo.',
        scannedAtIso,
        scannerEngineLabel,
      })
      return
    }

    const expectedSignature = hashSignature(`${parsed.weekKey}|${parsed.ticketId}|${parsed.code}|PMDEMO`)
    if (expectedSignature !== parsed.signature) {
      setScanResult({
        tone: 'danger',
        title: 'Boleto invalido',
        detail: 'La firma demo del QR no coincide. Posible QR alterado.',
        ticketId: parsed.ticketId,
        code: parsed.code,
        scannedAtIso,
        scannerEngineLabel,
      })
      return
    }

    if (parsed.weekKey !== store.weekKey) {
      setScanResult({
        tone: 'warning',
        title: 'Boleto fuera de semana',
        detail: `La demo se reinicia cada semana. Semana actual: ${store.weekKey}.`,
        ticketId: parsed.ticketId,
        code: parsed.code,
        scannedAtIso,
        scannerEngineLabel,
      })
      return
    }

    if (demoSessionMode !== 'local') {
      try {
        const response = await validateLandingDemoTicket(demoSessionId, { rawPayload })
        setStore(response.store as DemoStore)
        setDemoSessionMode('remote')

        if (response.status === 'valid') {
          setScanResult({
            tone: 'success',
            title: 'Boleto valido',
            detail: 'Acceso permitido. El ticket fue marcado como usado en la demo.',
            ticketId: response.ticket?.id ?? parsed.ticketId,
            code: response.ticket?.code ?? parsed.code,
            scannedAtIso: response.scannedAtIso,
            scannerEngineLabel,
          })
          return
        }

        if (response.status === 'already_used') {
          setScanResult({
            tone: 'warning',
            title: 'Boleto ya usado',
            detail: `Este ticket ya fue validado el ${response.ticket?.usedAtIso ? formatLocalDateTime(response.ticket.usedAtIso) : 'antes'}.`,
            ticketId: response.ticket?.id ?? parsed.ticketId,
            code: response.ticket?.code ?? parsed.code,
            scannedAtIso: response.scannedAtIso,
            scannerEngineLabel,
          })
          return
        }

        if (response.status === 'not_found') {
          setScanResult({
            tone: 'danger',
            title: 'Boleto no encontrado',
            detail: 'El QR es valido en formato, pero no existe en esta sesion demo compartida.',
            ticketId: parsed.ticketId,
            code: parsed.code,
            scannedAtIso: response.scannedAtIso,
            scannerEngineLabel,
          })
          return
        }

        if (response.status === 'code_mismatch') {
          setScanResult({
            tone: 'danger',
            title: 'Boleto invalido',
            detail: 'El codigo del QR no coincide con el ticket registrado.',
            ticketId: response.ticket?.id ?? parsed.ticketId,
            code: parsed.code,
            scannedAtIso: response.scannedAtIso,
            scannerEngineLabel,
          })
          return
        }
      } catch {
        if (demoSessionMode === 'remote') {
          setScanResult({
            tone: 'danger',
            title: 'Error de sincronizacion',
            detail: 'No se pudo validar contra la demo compartida. Revisa tu conexion e intenta de nuevo.',
            ticketId: parsed.ticketId,
            code: parsed.code,
            scannedAtIso,
            scannerEngineLabel,
          })
          return
        }
        setDemoSessionMode('local')
      }
    }

    setStore((prev) => {
      const ticketIndex = prev.tickets.findIndex((ticket) => ticket.id === parsed.ticketId)
      if (ticketIndex === -1) {
        setScanResult({
          tone: 'danger',
          title: 'Boleto no encontrado',
          detail: 'El QR es valido en formato, pero no existe en esta demo local.',
          ticketId: parsed.ticketId,
          code: parsed.code,
          scannedAtIso,
          scannerEngineLabel,
        })
        return prev
      }

      const ticket = prev.tickets[ticketIndex]
      if (ticket.code !== parsed.code) {
        setScanResult({
          tone: 'danger',
          title: 'Boleto invalido',
          detail: 'El codigo del QR no coincide con el ticket registrado.',
          ticketId: ticket.id,
          code: parsed.code,
          scannedAtIso,
          scannerEngineLabel,
        })
        return prev
      }

      if (ticket.status === 'used') {
        setScanResult({
          tone: 'warning',
          title: 'Boleto ya usado',
          detail: `Este ticket ya fue validado el ${ticket.usedAtIso ? formatLocalDateTime(ticket.usedAtIso) : 'antes'}.`,
          ticketId: ticket.id,
          code: ticket.code,
          scannedAtIso,
          scannerEngineLabel,
        })
        return prev
      }

      const nextTickets = [...prev.tickets]
      nextTickets[ticketIndex] = {
        ...ticket,
        status: 'used',
        usedAtIso: scannedAtIso,
      }

      setScanResult({
        tone: 'success',
        title: 'Boleto valido',
        detail: 'Acceso permitido. El ticket fue marcado como usado en la demo.',
        ticketId: ticket.id,
        code: ticket.code,
        scannedAtIso,
        scannerEngineLabel,
      })

      return {
        ...prev,
        tickets: nextTickets,
        activeTicketId: ticket.id,
      }
    })
  }

  function clearIssueForm() {
    setIssueGuestType('GENERAL')
    setIssueNote('')
  }

  async function shareTicket() {
    if (!activeTicket || isShareCooldownActive) return

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://passmonkey.club'
    const demoUrl = `${origin}/demo`
    const lines = [
      `Pass Monkey Demo - ${activeTicket.eventName}`,
      `Tipo: ${activeTicket.guestType}`,
      `Codigo: ${activeTicket.code}`,
      `Ticket ID: ${activeTicket.id}`,
      `Emitido: ${formatLocalDateTime(activeTicket.issuedAtIso)}`,
      activeTicket.note ? `Nota: ${activeTicket.note}` : '',
      '',
      'Demo ticket (muestra).',
      `Pruebalo en: ${demoUrl}`,
    ].filter(Boolean)

    const shareMessage = lines.join('\n')
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`
    let sharedFile: File | null = null

    try {
      if (qrDataUrl) {
        const imageBlob = await buildDemoTicketShareImage(qrDataUrl)
        if (imageBlob) {
          const fileName = `pass-monkey-demo-${activeTicket.code}.png`
          downloadBlobFile(imageBlob, fileName)
          sharedFile = new File([imageBlob], fileName, { type: 'image/png' })
        }
      }
    } catch {
      sharedFile = null
    }

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        const shareTitle = `Acceso ${activeTicket.guestType} - ${activeTicket.eventName}`
        const navigatorWithCanShare = navigator as Navigator & {
          canShare?: (data?: ShareData) => boolean
        }

        if (sharedFile) {
          const fileSharePayload: ShareData = {
            title: shareTitle,
            text: shareMessage,
            files: [sharedFile],
          }

          if (!navigatorWithCanShare.canShare || navigatorWithCanShare.canShare(fileSharePayload)) {
            await navigator.share(fileSharePayload)
          } else {
            await navigator.share({ title: shareTitle, text: shareMessage })
          }
        } else {
          await navigator.share({
            title: shareTitle,
            text: shareMessage,
          })
        }
        setLastSharedTicketId(activeTicket.id)
        setShareCooldownUntilTs(Date.now() + 30_000)
        setCooldownNowTs(Date.now())
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }

    setLastSharedTicketId(activeTicket.id)
    setShareCooldownUntilTs(Date.now() + 30_000)
    setCooldownNowTs(Date.now())
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
  }

  async function resetDemoWeek() {
    if (demoSessionMode !== 'local') {
      try {
        const response = await resetLandingDemoSession(demoSessionId)
        setStore(response.store as DemoStore)
        setDemoSessionMode('remote')
      } catch {
        if (demoSessionMode === 'remote') {
          setScanResult({
            tone: 'danger',
            title: 'No se pudo reiniciar',
            detail: 'Fallo el reinicio de la demo compartida. Intenta nuevamente.',
            scannedAtIso: new Date().toISOString(),
          })
          return
        }
        setDemoSessionMode('local')
        setStore(createEmptyStore(getIsoWeekKey()))
      }
    } else {
      const empty = createEmptyStore(getIsoWeekKey())
      setStore(empty)
    }

    setQrDataUrl('')
    clearIssueForm()
    setShareCooldownUntilTs(null)
    setLastSharedTicketId(null)
    setScanResult({
      tone: 'idle',
      title: 'Demo reiniciada',
      detail: 'Se limpiaron los tickets locales de este navegador.',
      scannedAtIso: new Date().toISOString(),
    })
  }

  const statusBadgeClass = activeTicket?.status === 'used'
    ? 'pm-demo-pill pm-demo-pill--warning'
    : 'pm-demo-pill pm-demo-pill--success'

  return (
    <div className="pm-demo-page">
      <header className="pm-demo-header">
        <div className="pm-demo-header__inner">
          <a href="/" className="pm-demo-back-link">
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Volver al inicio</span>
          </a>
          <div className="pm-demo-header__brand">
            <span>PASS</span>
            <span className="pm-demo-header__brand-accent">MONKEY</span>
            <small>Demo</small>
          </div>
        </div>
      </header>

      <main className="pm-demo-main">
        <section className="pm-demo-hero">
          <div>
            <p className="pm-demo-kicker">Demo interactiva sin API real</p>
            <h1>Prueba en 2 pasos lo facil que es usar Pass Monkey</h1>
            <p className="pm-demo-hero__copy">
              Si quieres verlo aplicado a tu operacion real, agenda una demo guiada desde aqui y despues te
              contactamos para revisar flujo de puerta, staff y tipo de evento.
            </p>
          </div>

          <div className="pm-demo-live-cta" role="note" aria-label="Siguiente paso comercial">
            <div className="pm-demo-live-cta__copy">
              <p className="pm-demo-live-cta__eyebrow">¿Te hizo sentido la demo?</p>
              <p className="pm-demo-live-cta__text">Agenda una demo guiada para tu fecha real.</p>
            </div>
            <a
              href="/#cta-final"
              className="pm-button pm-button--primary pm-demo-live-cta__button"
              onClick={() => trackLandingEvent('cta_schedule_demo_click', { location: 'demo_page_hero' })}
            >
              <CalendarDays size={16} aria-hidden="true" />
              Agendar demo guiada
            </a>
          </div>

          <div className="pm-demo-top-actions">
            <div className="pm-demo-segmented" role="tablist" aria-label="Demo de Pass Monkey">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'issue'}
                className={activeTab === 'issue' ? 'pm-demo-segmented__button is-active' : 'pm-demo-segmented__button'}
                onClick={() => setActiveTab('issue')}
              >
                <Ticket size={16} aria-hidden="true" />
                Emitir boleto
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'scan'}
                className={activeTab === 'scan' ? 'pm-demo-segmented__button is-active' : 'pm-demo-segmented__button'}
                onClick={() => setActiveTab('scan')}
              >
                <ScanLine size={16} aria-hidden="true" />
                Escanear boleto
              </button>
            </div>

            <button
              type="button"
              className="pm-button pm-button--ghost pm-demo-reset-button"
              onClick={() => { void resetDemoWeek() }}
            >
              <Undo2 size={16} aria-hidden="true" />
              Reiniciar demo local
            </button>
          </div>
        </section>

        <section className="pm-demo-grid">
          <div className="pm-demo-panel">
            <div className="pm-demo-panel__header">
              <div>
                <p className="pm-demo-panel__eyebrow">Boleto demo</p>
                <h2>{activeTab === 'issue' ? 'Emision de ticket' : 'Ticket actual'}</h2>
              </div>
              {activeTicket ? (
                <span className={statusBadgeClass}>
                  {activeTicket.status === 'used' ? 'Usado' : 'Disponible'}
                </span>
              ) : null}
            </div>

            <div className="pm-demo-ticket-card">
              <div className="pm-demo-ticket-visual">
                <img
                  src="/assets/ticket-demo-event.png"
                  alt="Ticket Demo Event de Pass Monkey"
                  className="pm-demo-ticket-visual__image"
                />
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR funcional del boleto ${activeTicket?.code ?? ''}`}
                    className="pm-demo-ticket-visual__qr"
                  />
                ) : (
                  <div className="pm-demo-ticket-visual__placeholder" aria-hidden="true">
                    <QrCode size={26} />
                    <span>Genera un boleto para insertar el QR</span>
                  </div>
                )}
                {isActiveTicketSharedAndLocked ? (
                  <div className="pm-demo-ticket-visual__overlay">
                    <div className="pm-demo-ticket-visual__overlay-card">
                      <p>Boleto compartido</p>
                      <strong>Espera {shareCooldownSeconds}s para generar otro</strong>
                      <button
                        type="button"
                        className="pm-button pm-button--primary pm-demo-ticket-visual__overlay-button"
                        onClick={() => setActiveTab('scan')}
                      >
                        <ScanLine size={16} aria-hidden="true" />
                        Ir al escaner
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="pm-demo-panel">
            {activeTab === 'issue' ? (
              <>
                <div className="pm-demo-panel__header">
                  <div>
                    <p className="pm-demo-panel__eyebrow">Paso 1</p>
                    <h2>Generar acceso rapido</h2>
                  </div>
                </div>

                <div className="pm-demo-flow">
                  <div className="pm-demo-availability" aria-live="polite">
                    <span>Tickets disponibles por hoy</span>
                    <strong>{remainingThisWeek}</strong>
                  </div>

                  <div className="pm-demo-rp-card">
                    <div className="pm-demo-rp-card__field-group">
                      <p className="pm-demo-rp-card__field-label">Tipo de invitado</p>
                      <div className="pm-demo-rp-card__chips">
                        {(['GENERAL', 'VIP', 'CORTESIA'] as const).map((typeOption) => (
                          <button
                            key={typeOption}
                            type="button"
                            onClick={() => setIssueGuestType(typeOption)}
                            disabled={isShareCooldownActive}
                            className={issueGuestType === typeOption
                              ? 'pm-demo-rp-card__chip is-active'
                              : 'pm-demo-rp-card__chip'}
                          >
                            {typeOption === 'CORTESIA' ? 'Cortesia' : typeOption === 'GENERAL' ? 'General' : 'VIP'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pm-demo-rp-card__field-group">
                      <label className="pm-demo-rp-card__field-label" htmlFor="pm-demo-note-input">
                        Nota (opcional)
                      </label>
                      <input
                        id="pm-demo-note-input"
                        type="text"
                        value={issueNote}
                        onChange={(event) => setIssueNote(event.target.value)}
                        className="pm-demo-rp-card__input"
                        placeholder="Nombre del invitado, mesa o referencia"
                        maxLength={80}
                        disabled={isShareCooldownActive}
                      />
                    </div>

                    <div className="pm-demo-rp-card__actions">
                      <button
                        type="button"
                        className="pm-button pm-button--primary pm-demo-big-button"
                        onClick={() => { void generateTicket() }}
                        disabled={isGeneratingTicket || remainingThisWeek <= 0 || isShareCooldownActive}
                      >
                        {isGeneratingTicket ? (
                          <>
                            <RefreshCcw size={16} className="pm-demo-spin" aria-hidden="true" />
                            Generando acceso...
                          </>
                        ) : isShareCooldownActive ? (
                          <>
                            <Undo2 size={16} aria-hidden="true" />
                            Espera {shareCooldownSeconds}s
                          </>
                        ) : (
                          <>
                            <Ticket size={16} aria-hidden="true" />
                            Generar acceso ahora
                          </>
                        )}
                      </button>
                    </div>

                    <div className="pm-demo-rp-card__footer-actions">
                      <button
                        type="button"
                        className="pm-button pm-button--secondary pm-demo-big-button"
                        onClick={() => setActiveTab('scan')}
                      >
                        <ScanLine size={16} aria-hidden="true" />
                        Ir a escanear boleto
                      </button>
                      <button
                        type="button"
                        className="pm-button pm-button--secondary pm-demo-big-button"
                        onClick={() => { void shareTicket() }}
                        disabled={!activeTicket || isShareCooldownActive}
                      >
                        <Share2 size={16} aria-hidden="true" />
                        {isShareCooldownActive ? `Compartido · espera ${shareCooldownSeconds}s` : 'Descargar y compartir'}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="pm-demo-panel__header">
                  <div>
                    <p className="pm-demo-panel__eyebrow">Paso 2</p>
                    <h2>Escaner demo (validacion local)</h2>
                  </div>
                </div>

                <div className="pm-demo-flow">
                  <div className="pm-demo-camera-card">
                    <div className="pm-demo-camera-card__header">
                      <div>
                        <p className="pm-demo-panel__eyebrow">Scanner en vivo</p>
                        <h3>Camara directa (QR)</h3>
                      </div>
                      <span className={`pm-demo-camera-status pm-demo-camera-status--${cameraStatus}`}>
                        {cameraStatus === 'active' && 'Activa'}
                        {cameraStatus === 'starting' && 'Iniciando'}
                        {cameraStatus === 'unsupported' && 'Sin soporte'}
                        {cameraStatus === 'blocked' && 'Bloqueada'}
                        {cameraStatus === 'error' && 'Error'}
                        {cameraStatus === 'idle' && 'Lista'}
                      </span>
                    </div>

                    <p className="pm-demo-camera-card__message">{cameraMessage}</p>

                    <div className="pm-demo-camera-facing">
                      <span className="pm-demo-camera-facing__label">Camara</span>
                      <div className="pm-demo-camera-facing__segmented" role="radiogroup" aria-label="Seleccion de camara">
                        <button
                          type="button"
                          role="radio"
                          aria-checked={cameraFacingMode === 'environment'}
                          className={cameraFacingMode === 'environment'
                            ? 'pm-demo-camera-facing__button is-active'
                            : 'pm-demo-camera-facing__button'}
                          onClick={() => setCameraFacingMode('environment')}
                        >
                          Trasera
                        </button>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={cameraFacingMode === 'user'}
                          className={cameraFacingMode === 'user'
                            ? 'pm-demo-camera-facing__button is-active'
                            : 'pm-demo-camera-facing__button'}
                          onClick={() => setCameraFacingMode('user')}
                        >
                          Frontal
                        </button>
                      </div>
                    </div>

                    <div className="pm-demo-camera-preview">
                      {cameraStatus === 'active' || cameraStatus === 'starting' ? (
                        <video
                          ref={cameraVideoRef}
                          className="pm-demo-camera-preview__video"
                          autoPlay
                          muted
                          playsInline
                        />
                      ) : (
                        <div className="pm-demo-camera-preview__placeholder" aria-hidden="true">
                          <ScanLine size={18} />
                          <span>Preview de camara</span>
                        </div>
                      )}
                    </div>

                    <div className="pm-demo-flow__cta pm-demo-flow__cta--stack">
                      <button
                        type="button"
                        className="pm-button pm-button--ghost pm-demo-big-button"
                        onClick={() => { void startCameraMode() }}
                        disabled={cameraStatus === 'starting' || cameraStatus === 'active'}
                      >
                        <ScanLine size={16} aria-hidden="true" />
                        {cameraStatus === 'active' ? 'Camara activa' : 'Iniciar camara'}
                      </button>
                      {(cameraStatus === 'active' || cameraStatus === 'starting') ? (
                        <button
                          type="button"
                          className="pm-button pm-button--secondary pm-demo-big-button"
                          onClick={() => stopCameraMode({ nextStatus: 'idle', message: 'Camara detenida.' })}
                        >
                          <Undo2 size={16} aria-hidden="true" />
                          Detener camara
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {scanResult.tone !== 'idle' ? (
                    <div className={getScanToneClass(scanResult.tone)} role="status" aria-live="polite">
                      <h3>{scanResult.title}</h3>
                      <p>{scanResult.detail}</p>
                      {scanResult.scannerEngineLabel ? (
                        <div className="pm-demo-scan-result__engine">
                          <span>Leido con {scanResult.scannerEngineLabel}</span>
                        </div>
                      ) : null}
                      {(scanResult.ticketId || scanResult.code || scanResult.scannedAtIso) ? (
                        <div className="pm-demo-scan-result__meta">
                          {scanResult.ticketId ? <span>Ticket: {scanResult.ticketId}</span> : null}
                          {scanResult.code ? <span>Codigo: {scanResult.code}</span> : null}
                          {scanResult.scannedAtIso ? <span>Escaneo: {formatLocalDateTime(scanResult.scannedAtIso)}</span> : null}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      <FooterSection />
    </div>
  )
}
