import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { rpApi } from '../api'
import { RpStateView } from '../components/RpStateView'
import { Button } from '@/components/ui'
import { useToast } from '@/components/ToastProvider'

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
  const [ticketImageUrl, setTicketImageUrl] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [isLoadingImage, setIsLoadingImage] = useState(false)

  const generatedState = useMemo(() => (isGeneratedState(state) ? state : null), [state])

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

  const openWhatsApp = () => {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
  }

  const copyShareText = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage)
      toast.showToast({ title: 'Enlace copiado', variant: 'success' })
    } catch {
      toast.showToast({ title: 'No se pudo copiar el enlace', variant: 'warning' })
    }
  }

  const shareAccess = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Acceso generado',
          text: shareMessage,
        })
        return
      } catch {
        // If the user cancels native share, we do not show an error toast.
      }
    }

    await copyShareText()
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
  }

  return (
    <div className="rp-generated-screen">
      <section className="rp-generated-success">
        <div className="rp-generated-success__icon-shell" aria-hidden="true">
          <span className="material-symbols-outlined rp-generated-success__icon">check</span>
        </div>
        <h3 className="rp-generated-success__title">Acceso Generado</h3>
        <p className="rp-generated-success__subtitle">El pase {generatedState.guestType} esta listo para compartir</p>
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
        <Button type="button" variant="success" block onClick={openWhatsApp}>
          Compartir por WhatsApp
        </Button>
        <Button type="button" variant="secondary" block onClick={() => void copyShareText()}>
          Copiar enlace
        </Button>
        <Button type="button" block onClick={() => void shareAccess()}>
          Compartir Acceso
        </Button>
        <Button type="button" variant="secondary" block onClick={downloadImage}>
          Descargar Imagen
        </Button>
      </div>

      <Button type="button" variant="ghost" className="rp-generated-screen__back" onClick={() => navigate(`/rp/generate/${generatedState.assignmentId}`)}>
        {'<- Generar otro acceso'}
      </Button>
    </div>
  )
}
