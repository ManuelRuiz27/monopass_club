import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type ScanPhase = 'ready' | 'scanning' | 'result'
type ShotTone = 'neutral' | 'success' | 'error'
type LogEntry = {
  id: number
  time: string
  status: ShotTone
  message: string
}

type Metrics = {
  flowPerMin: number
  queueMinutesSaved: number
  duplicatesBlocked: number
  revenueProtected: number
  attendance: number
}

type Shot = {
  id: string
  label: string
  src: string
  tone: ShotTone
  result: string
  note: string
}

const SHOTS: Shot[] = [
  {
    id: 'home',
    label: 'Camara lista',
    src: '/assets/screenshots/anim/scanner-video-frame-01-home.png',
    tone: 'neutral',
    result: 'Listo para escanear',
    note: 'Scanner preparado en puerta',
  },
  {
    id: 'ok',
    label: 'Acceso validado',
    src: '/assets/screenshots/anim/scanner-video-frame-04-validado.png',
    tone: 'success',
    result: 'Acceso aprobado',
    note: 'Entrada confirmada en segundos',
  },
  {
    id: 'used',
    label: 'Ticket ya usado',
    src: '/assets/screenshots/anim/scanner-video-frame-05-fraude.png',
    tone: 'error',
    result: 'Acceso rechazado',
    note: 'Intento duplicado detectado',
  },
  {
    id: 'cuts',
    label: 'Cortes en vivo',
    src: '/assets/screenshots/anim/staff-video-frame-01-dashboard.png',
    tone: 'neutral',
    result: 'Operacion trazable',
    note: 'Cortes por RP y evento en tiempo real',
  },
]

const LOOP_RESULTS = [1, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 3, 1, 1, 1, 1, 2, 1, 1, 1, 1] as const
const SCAN_DURATION_MS = 800
const RESULT_DURATION_MS = 1800
const LOOP_INTERVAL_MS = 5000
const METRIC_ANIMATION_MS = 820

const BASE_METRICS: Metrics = {
  flowPerMin: 19,
  queueMinutesSaved: 12,
  duplicatesBlocked: 0,
  revenueProtected: 4200,
  attendance: 465,
}

const TARGET_METRICS: Record<'ready' | 'scanning' | 'success' | 'error' | 'neutral', Metrics> = {
  ready: BASE_METRICS,
  scanning: {
    flowPerMin: 34,
    queueMinutesSaved: 44,
    duplicatesBlocked: 1,
    revenueProtected: 14600,
    attendance: 465, // Doesn't go up until success
  },
  success: {
    flowPerMin: 39,
    queueMinutesSaved: 61,
    duplicatesBlocked: 2,
    revenueProtected: 19800,
    attendance: 466, // +1
  },
  error: {
    flowPerMin: 36,
    queueMinutesSaved: 57,
    duplicatesBlocked: 3,
    revenueProtected: 23250,
    attendance: 466, // Stays same on error
  },
  neutral: {
    flowPerMin: 37,
    queueMinutesSaved: 59,
    duplicatesBlocked: 2,
    revenueProtected: 18700,
    attendance: 466,
  },
}

const integerFormat = new Intl.NumberFormat('es-MX')

function easeOutQuart(value: number) {
  return 1 - (1 - value) ** 4
}

function roundMetrics(values: Metrics): Metrics {
  return {
    flowPerMin: Math.round(values.flowPerMin),
    queueMinutesSaved: Math.round(values.queueMinutesSaved),
    duplicatesBlocked: Math.round(values.duplicatesBlocked),
    revenueProtected: Math.round(values.revenueProtected),
    attendance: Math.round(values.attendance)
  }
}

function generateTime() {
  const d = new Date()
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
}

export function HeroScanExperience() {
  const [phase, setPhase] = useState<ScanPhase>('ready')
  const [activeShotIndex, setActiveShotIndex] = useState(0)
  const [metrics, setMetrics] = useState<Metrics>(BASE_METRICS)
  const [logs, setLogs] = useState<LogEntry[]>([{ id: 0, time: generateTime(), status: 'neutral', message: 'Sistema conectado. Esperando escaneos.' }])

  const timeoutIdsRef = useRef<number[]>([])
  const loopCursorRef = useRef(0)
  const metricsRef = useRef<Metrics>(BASE_METRICS)
  const rafRef = useRef<number | null>(null)
  const logIdCounter = useRef(1)

  const clearTimers = useCallback(() => {
    for (const timeoutId of timeoutIdsRef.current) {
      window.clearTimeout(timeoutId)
    }
    timeoutIdsRef.current = []
  }, [])

  const clearMetricAnimation = useCallback(() => {
    if (rafRef.current) {
      window.cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const activeShot = SHOTS[activeShotIndex]

  const addLog = useCallback((status: ShotTone, message: string) => {
    setLogs(prev => {
      const next = [{ id: logIdCounter.current++, time: generateTime(), status, message }, ...prev]
      return next.slice(0, 4) // Keep only last 4 logs to avoid overflow in the UI
    })
  }, [])

  const runSimulation = useCallback(
    (forcedResultIndex?: number) => {
      if (phase === 'scanning') return

      const nextResultIndex =
        typeof forcedResultIndex === 'number'
          ? forcedResultIndex
          : LOOP_RESULTS[loopCursorRef.current % LOOP_RESULTS.length]

      loopCursorRef.current = (loopCursorRef.current + 1) % LOOP_RESULTS.length

      clearTimers()
      setPhase('scanning')
      setActiveShotIndex(0)
      addLog('neutral', 'Analizando token de acceso...')

      const toResultTimeout = window.setTimeout(() => {
        setActiveShotIndex(nextResultIndex)
        setPhase('result')

        // Add context specific log
        const resultTone = SHOTS[nextResultIndex].tone
        if (resultTone === 'success') {
          addLog('success', 'Entrada Gral. - Juan Perez (+1 Aforo)')
        } else if (resultTone === 'error') {
          addLog('error', 'BLOQUEO: Intento de pase duplicado (VIP)')
        } else {
          addLog('neutral', 'Actualizando cortes de RP')
        }

      }, SCAN_DURATION_MS)

      const backToReadyTimeout = window.setTimeout(() => {
        setPhase('ready')
        setActiveShotIndex(0)
      }, SCAN_DURATION_MS + RESULT_DURATION_MS)

      timeoutIdsRef.current.push(toResultTimeout, backToReadyTimeout)
    },
    [clearTimers, phase, addLog],
  )

  useEffect(() => {
    let targetKey: keyof typeof TARGET_METRICS = 'ready'
    if (phase === 'scanning') {
      targetKey = 'scanning'
    } else if (phase === 'result') {
      targetKey = activeShot.tone
    }

    clearMetricAnimation()
    const target = TARGET_METRICS[targetKey]
    const start = metricsRef.current
    const startedAt = performance.now()

    // If success, we permanently increment the base attendance for realistic effect
    if (targetKey === 'success') {
      BASE_METRICS.attendance += 1;
      TARGET_METRICS.ready.attendance = BASE_METRICS.attendance;
      TARGET_METRICS.neutral.attendance = BASE_METRICS.attendance;
      TARGET_METRICS.scanning.attendance = BASE_METRICS.attendance;
      TARGET_METRICS.error.attendance = BASE_METRICS.attendance;
      TARGET_METRICS.success.attendance = BASE_METRICS.attendance + 1; // Prepare next
    }

    const animate = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / METRIC_ANIMATION_MS)
      const eased = easeOutQuart(progress)
      const next = roundMetrics({
        flowPerMin: start.flowPerMin + (target.flowPerMin - start.flowPerMin) * eased,
        queueMinutesSaved: start.queueMinutesSaved + (target.queueMinutesSaved - start.queueMinutesSaved) * eased,
        duplicatesBlocked: start.duplicatesBlocked + (target.duplicatesBlocked - start.duplicatesBlocked) * eased,
        revenueProtected: start.revenueProtected + (target.revenueProtected - start.revenueProtected) * eased,
        attendance: start.attendance + (target.attendance - start.attendance) * eased,
      })

      metricsRef.current = next
      setMetrics(next)

      if (progress < 1) {
        rafRef.current = window.requestAnimationFrame(animate)
      } else {
        rafRef.current = null
      }
    }

    rafRef.current = window.requestAnimationFrame(animate)
    return clearMetricAnimation
  }, [activeShot.tone, clearMetricAnimation, phase])

  useEffect(() => {
    const loopId = window.setInterval(() => {
      runSimulation()
    }, LOOP_INTERVAL_MS)

    return () => {
      window.clearInterval(loopId)
      clearTimers()
      clearMetricAnimation()
    }
  }, [clearMetricAnimation, clearTimers, runSimulation])

  const hudTitle = useMemo(() => {
    if (phase === 'scanning') return 'Escaneando QR...'
    if (phase === 'result') return activeShot.result
    return 'Sistema en espera'
  }, [activeShot.result, phase])

  const hudNote = useMemo(() => {
    if (phase === 'scanning') return 'Analizando token en tiempo real'
    return activeShot.note
  }, [activeShot.note, phase])

  return (
    <section className="hero-scan-lab" aria-label="Simulador combinado Puerta y Manager">
      {/* Phone Simulator (Left) */}
      <div className="hero-scan-lab__simulator">
        <div className="hero-phone hero-phone--sim">
          <div className="hero-phone__screen">
            <img src={activeShot.src} alt={activeShot.label} className="hero-phone__img" />
            <div className={`hero-scan-lab__beam ${phase === 'scanning' ? 'is-active' : ''}`} aria-hidden="true" />
            <div
              className={`hero-scan-lab__hud hero-scan-lab__hud--${phase === 'scanning' ? 'neutral' : activeShot.tone}`}
              aria-live="polite"
            >
              <p className="hero-scan-lab__hud-kicker">Escaneo en menos de 1 segundo</p>
              <strong>{hudTitle}</strong>
              <span>{hudNote}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Manager Dashboard (Right) */}
      <aside className="hero-dash" aria-label="Dashboard en vivo de Manager">

        {/* Header Navbar Simulator */}
        <header className="hero-dash__header">
          <div className="hero-dash__pulse" />
          <span>Manager Live</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            <div className="hero-dash__tab" />
            <div className="hero-dash__tab" />
            <div className="hero-dash__tab" />
          </div>
        </header>

        <h3 className="hero-dash__title">Panel Operativo <br />(Noche en Curso)</h3>

        {/* KPI Grid */}
        <div className="hero-dash__kpis">
          <div className="hero-dash__kpi-box hero-dash__kpi-box--accent">
            <span>Aforo Actual</span>
            <strong>{integerFormat.format(metrics.attendance)}</strong>
          </div>
          <div className="hero-dash__kpi-box">
            <span>Fila ahorrada</span>
            <strong>{integerFormat.format(metrics.queueMinutesSaved)} min</strong>
          </div>
          <div className="hero-dash__kpi-box" style={{ borderColor: activeShot.tone === 'error' ? 'rgba(255, 47, 102, 0.4)' : '' }}>
            <span style={{ color: activeShot.tone === 'error' ? 'var(--alert)' : '' }}>Bloqueos</span>
            <strong style={{ color: activeShot.tone === 'error' ? 'var(--alert)' : '' }}>{integerFormat.format(metrics.duplicatesBlocked)}</strong>
          </div>
        </div>

        {/* Animated Chart */}
        <div className="hero-dash__chart">
          <span>Flujo de entrada (Últimos 15 min)</span>
          <div className="hero-dash__bars">
            {[60, 45, 80, 50, 95, 70, 85].map((height, i) => {
              // Last bar acts dynamically based on scan
              const isLast = i === 6
              let barHeight = `${height}%`
              let barBg = 'rgba(255,255,255,0.1)'

              if (isLast) {
                if (phase === 'scanning') { barHeight = '50%'; barBg = 'var(--neon-cyan)' }
                else if (activeShot.tone === 'success') { barHeight = '100%'; barBg = 'var(--acid)' }
                else if (activeShot.tone === 'error') { barHeight = '30%'; barBg = 'var(--alert)' }
                else { barBg = 'var(--acid)' } // Default state
              }

              return <div key={i} className="hero-dash__bar" style={{ height: barHeight, background: barBg, transition: 'height 0.4s ease, background 0.4s ease' }} />
            })}
          </div>
        </div>

        {/* Live Activity Log */}
        <div className="hero-dash__log">
          <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-soft)', margin: '0 0 8px 0' }}>Registro de actividad</p>
          <div className="hero-dash__feed">
            {logs.map((log) => (
              <div key={log.id} className="hero-dash__entry" style={{
                animation: 'slideIn 0.3s ease-out forwards',
              }}>
                <span className={`hero-dash__dot hero-dash__dot--${log.status}`} />
                <span style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>{log.time}</span>
                <span style={{ color: log.status === 'error' ? 'var(--alert)' : log.status === 'success' ? '#fff' : 'var(--text-soft)', fontSize: '0.75rem' }}>{log.message}</span>
              </div>
            ))}
          </div>
        </div>

      </aside>
    </section>
  )
}
