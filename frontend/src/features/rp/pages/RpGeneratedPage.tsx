import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { useLocation, useNavigate } from 'react-router-dom'
import { rpApi } from '../api'
import { RpStateView } from '../components/RpStateView'
import { Button } from '@/components/ui'
import { useToast } from '@/components/ToastProvider'
import { usePrefersReducedMotion } from '@/lib/motion/usePrefersReducedMotion'

type GeneratedState = {
  ticketId: string
  guestType: string
  eventName: string
  eventStartsAt: string
  assignmentId: string
  shareCopy: string
}

function isGeneratedState(input: unknown): input is GeneratedState {
  if (!input || typeof input !== 'object') return false
  const data = input as Record<string, unknown>
  return (
    typeof data.ticketId === 'string' &&
    typeof data.guestType === 'string' &&
    typeof data.eventName === 'string' &&
    typeof data.eventStartsAt === 'string' &&
    typeof data.assignmentId === 'string' &&
    typeof data.shareCopy === 'string'
  )
}

function formatDate(dateValue: string) {
  return new Date(dateValue).toLocaleDateString([], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function RpGeneratedPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const toast = useToast()
  const screenRef = useRef<HTMLDivElement | null>(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const [ticketImageUrl, setTicketImageUrl] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [isLoadingImage, setIsLoadingImage] = useState(false)

  const generatedState = useMemo(() => (isGeneratedState(state) ? state : null), [state])

  useLayoutEffect(() => {
    if (prefersReducedMotion || !generatedState) return

    const scope = screenRef.current
    if (!scope) return

    const select = gsap.utils.selector(scope)
    const actionButtons = gsap.utils.toArray<HTMLElement>('.rp-generated-actions > *', scope)
    const timeline = gsap.timeline({ defaults: { ease: 'power2.out' } })

    timeline
      .fromTo(
        select('.rp-generated-success__icon-shell'),
        { autoAlpha: 0, scale: 0.84 },
        { autoAlpha: 1, scale: 1, duration: 0.26, clearProps: 'opacity,transform' },
      )
      .fromTo(
        select('.rp-generated-success__title, .rp-generated-success__subtitle'),
        { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, duration: 0.24, stagger: 0.06, clearProps: 'opacity,transform' },
        '-=0.12',
      )
      .fromTo(
        select('.rp-generated-ticket'),
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: 0.28, clearProps: 'opacity,transform' },
        '-=0.1',
      )
      .fromTo(
        select('.rp-generated-proof > *'),
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: 0.2, stagger: 0.05, clearProps: 'opacity,transform' },
        '-=0.1',
      )

    if (actionButtons.length > 0) {
      timeline.fromTo(
        actionButtons,
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: 0.2, stagger: 0.05, clearProps: 'opacity,transform' },
        '-=0.12',
      )
    }

    timeline.fromTo(
      select('.rp-generated-screen__back'),
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.2, clearProps: 'opacity' },
      '-=0.08',
    )

    return () => {
      timeline.kill()
    }
  }, [generatedState, prefersReducedMotion])

  useLayoutEffect(() => {
    if (prefersReducedMotion || !ticketImageUrl) return

    const scope = screenRef.current
    const image = scope?.querySelector<HTMLElement>('.rp-generated-ticket__image')
    if (!image) return

    const tween = gsap.fromTo(
      image,
      { autoAlpha: 0, scale: 0.96 },
      { autoAlpha: 1, scale: 1, duration: 0.22, ease: 'power2.out', clearProps: 'opacity,transform' },
    )

    return () => {
      tween.kill()
    }
  }, [prefersReducedMotion, ticketImageUrl])

  useEffect(() => {
    if (!generatedState) return

    let active = true
    let objectUrl: string | null = null

    queueMicrotask(() => {
      if (!active) return
      setIsLoadingImage(true)
      setImageError(null)
    })

    rpApi
      .getTicketImage(generatedState.ticketId)
      .then((imageBlob) => {
        if (!active) return
        objectUrl = URL.createObjectURL(imageBlob)
        setTicketImageUrl(objectUrl)
      })
      .catch((error: unknown) => {
        if (!active) return
        setImageError(error instanceof Error ? error.message : 'No se pudo cargar la vista previa del ticket.')
      })
      .finally(() => {
        if (active) setIsLoadingImage(false)
      })

    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      setTicketImageUrl(null)
    }
  }, [generatedState])

  if (!generatedState) {
    return (
      <div className="rp-screen">
        <RpStateView
          icon="qr_code"
          title="No hay acceso generado"
          description="Genera un acceso para ver esta pantalla."
          actions={
            <Button type="button" variant="secondary" onClick={() => navigate('/rp/events')}>
              Volver a mis eventos
            </Button>
          }
        />
      </div>
    )
  }

  const shareMessage = `${generatedState.shareCopy} Codigo: ${generatedState.ticketId}`
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`
  const salesProof = [
    { label: 'Canal principal', value: 'WhatsApp' },
    { label: 'Respaldo', value: 'Descarga PNG' },
    { label: 'Hora registro', value: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
  ]

  const trackDelivery = async (method: 'WHATSAPP' | 'DOWNLOAD') => {
    try {
      await rpApi.trackTicketDelivery(generatedState.ticketId, method)
    } catch {
      // Tracking is best-effort and should not block RP flow.
    }
  }

  const openWhatsApp = async () => {
    if (ticketImageUrl && typeof navigator.share === 'function' && typeof navigator.canShare === 'function') {
      try {
        const imageResponse = await fetch(ticketImageUrl)
        const imageBlob = await imageResponse.blob()
        const imageFile = new File([imageBlob], `ticket-${generatedState.ticketId}.png`, {
          type: imageBlob.type || 'image/png',
        })

        if (navigator.canShare({ files: [imageFile] })) {
          try {
            await navigator.share({
              title: 'Acceso generado',
              text: shareMessage,
              files: [imageFile],
            })
            await trackDelivery('WHATSAPP')
            return
          } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') return
          }
        }
      } catch {
        // If we cannot prepare file-sharing, we fallback to WhatsApp URL sharing.
      }
    }

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
    void trackDelivery('WHATSAPP')
  }

  const downloadImage = () => {
    if (!ticketImageUrl) {
      toast.showToast({ title: 'La imagen aun no esta disponible', variant: 'warning' })
      return
    }

    const link = document.createElement('a')
    link.href = ticketImageUrl
    link.download = `ticket-${generatedState.ticketId}.png`
    link.click()
    void trackDelivery('DOWNLOAD')
  }

  return (
    <div ref={screenRef} className="rp-generated-screen">
      <section className="rp-generated-success">
        <div className="rp-generated-success__icon-shell" aria-hidden="true">
          <span className="material-symbols-outlined rp-generated-success__icon">check</span>
        </div>
        <h3 className="rp-generated-success__title">Acceso Generado</h3>
        <p className="rp-generated-success__subtitle">El pase {generatedState.guestType} quedo listo para vender y validar en segundos.</p>
      </section>

      <section className="rp-generated-proof" aria-label="Metricas de flujo">
        {salesProof.map((item) => (
          <article key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      <section className="rp-generated-ticket">
        <span className="rp-generated-ticket__badge">{generatedState.guestType}</span>

        <div className="rp-generated-ticket__qr-frame" data-testid="ticket-preview" data-ticket-id={generatedState.ticketId}>
          {ticketImageUrl ? (
            <img src={ticketImageUrl} alt="Vista previa del ticket" className="rp-generated-ticket__image" />
          ) : (
            <span className="material-symbols-outlined rp-generated-ticket__placeholder-icon" aria-hidden="true">
              qr_code_2
            </span>
          )}
        </div>

        <div className="rp-generated-ticket__meta">
          <p className="rp-generated-ticket__event">{generatedState.eventName}</p>
          <p className="rp-generated-ticket__club">{formatDate(generatedState.eventStartsAt)}</p>
        </div>

        {isLoadingImage ? <p className="text-muted rp-generated-ticket__helper">Cargando vista previa...</p> : null}
        {imageError ? <p className="text-warning rp-generated-ticket__helper">{imageError}</p> : null}
      </section>

      <div className="rp-generated-actions">
        <Button type="button" variant="success" block onClick={() => void openWhatsApp()}>
          Compartir por WhatsApp ahora
        </Button>
        <Button type="button" variant="secondary" block onClick={downloadImage}>
          Descargar Imagen
        </Button>
      </div>

      <Button
        type="button"
        variant="ghost"
        className="rp-generated-screen__back"
        onClick={() => navigate(`/rp/events?assignmentId=${generatedState.assignmentId}`)}
      >
        {'<- Generar otro acceso'}
      </Button>
    </div>
  )
}
