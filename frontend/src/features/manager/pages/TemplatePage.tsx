import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { managerApi, type EventDTO } from '../api'
import { useToast } from '@/components/ToastProvider'

const MIN_QR_SIZE = 0.1
const MAX_QR_SIZE = 0.8

const defaultTemplateState = {
  templateImageUrl: '',
  qrPositionX: 0.5,
  qrPositionY: 0.5,
  qrSize: 0.35,
}

export function TemplatePage() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const eventsQuery = useQuery({ queryKey: ['events'], queryFn: managerApi.getEvents })
  const [selectedEventId, setSelectedEventId] = useState('')
  const [template, setTemplate] = useState(defaultTemplateState)
  const [isDragging, setIsDragging] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const dragPointerId = useRef<number | null>(null)
  const pointerPositions = useRef(new Map<number, { x: number; y: number }>())
  const pinchState = useRef<{ distance: number; size: number } | null>(null)

  const selectedEvent = useMemo<EventDTO | undefined>(
    () => eventsQuery.data?.find((event) => event.id === selectedEventId),
    [eventsQuery.data, selectedEventId],
  )

  useEffect(() => {
    if (selectedEvent) {
      setTemplate({
        templateImageUrl: selectedEvent.templateImageUrl ?? '',
        qrPositionX: selectedEvent.qrPositionX ?? 0.5,
        qrPositionY: selectedEvent.qrPositionY ?? 0.5,
        qrSize: selectedEvent.qrSize ?? 0.35,
      })
    } else {
      setTemplate(defaultTemplateState)
    }
  }, [selectedEvent])

  const updateTemplate = useMutation({
    mutationFn: () =>
      managerApi.updateTemplate(selectedEventId, {
        templateImageUrl: template.templateImageUrl || null,
        qrPositionX: template.qrPositionX,
        qrPositionY: template.qrPositionY,
        qrSize: template.qrSize,
      }),
    onSuccess: () => {
      toast.showToast({ title: 'Plantilla guardada', variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
    onError: (err: unknown) => {
      toast.showToast({
        title: 'No se pudo guardar la plantilla',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      })
    },
  })

  const handleImageUpload = (file: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setTemplate((prev) => ({ ...prev, templateImageUrl: reader.result as string }))
    }
    reader.readAsDataURL(file)
  }

  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!selectedEventId || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    pointerPositions.current.set(event.pointerId, { x: event.clientX - rect.left, y: event.clientY - rect.top })
    canvasRef.current.setPointerCapture(event.pointerId)

    if (pointerPositions.current.size === 1) {
      setIsDragging(true)
      dragPointerId.current = event.pointerId
      pinchState.current = null
    } else if (pointerPositions.current.size === 2) {
      setIsDragging(false)
      dragPointerId.current = null
      const [first, second] = Array.from(pointerPositions.current.values())
      const distance = Math.hypot(second.x - first.x, second.y - first.y) || 1
      pinchState.current = { distance, size: template.qrSize }
    }
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    if (pointerPositions.current.has(event.pointerId)) {
      pointerPositions.current.set(event.pointerId, { x: event.clientX - rect.left, y: event.clientY - rect.top })
    }

    if (pointerPositions.current.size === 2 && pinchState.current) {
      const [first, second] = Array.from(pointerPositions.current.values())
      const distance = Math.hypot(second.x - first.x, second.y - first.y)
      const ratio = distance / pinchState.current.distance
      const nextSize = clamp(pinchState.current.size * ratio, MIN_QR_SIZE, MAX_QR_SIZE)
      setTemplate((prev) => ({ ...prev, qrSize: Number(nextSize.toFixed(3)) }))
      return
    }

    if (!isDragging || dragPointerId.current !== event.pointerId) return
    const nextX = clamp((event.clientX - rect.left) / rect.width, 0, 1)
    const nextY = clamp((event.clientY - rect.top) / rect.height, 0, 1)
    setTemplate((prev) => ({ ...prev, qrPositionX: Number(nextX.toFixed(3)), qrPositionY: Number(nextY.toFixed(3)) }))
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    pointerPositions.current.delete(event.pointerId)
    if (canvasRef.current) {
      try {
        canvasRef.current.releasePointerCapture(event.pointerId)
      } catch {
        // ignore
      }
    }
    setIsDragging(false)
    dragPointerId.current = null
    if (pointerPositions.current.size < 2) {
      pinchState.current = null
    }
  }

  const qrSizePercent = `${Math.round(template.qrSize * 100)}%`
  return (
    <div>
      <h3>Plantilla / QR</h3>
      <p className="text-muted">
        Sube la imagen base, posiciona el QR y pellizca para ajustar el tamano.
      </p>
      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault()
          updateTemplate.mutate()
        }}
      >
        <label>
          Evento
          <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)} required>
            <option value="" disabled>
              Selecciona un evento
            </option>
            {eventsQuery.data?.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Imagen base
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e.target.files?.[0] ?? null)}
            disabled={!selectedEventId}
          />
        </label>
        <label>
          Escala QR ({qrSizePercent})
          <input
            type="range"
            min={MIN_QR_SIZE}
            max={MAX_QR_SIZE}
            step={0.01}
            value={template.qrSize}
            onChange={(e) => setTemplate((prev) => ({ ...prev, qrSize: Number(e.target.value) }))}
            disabled={!selectedEventId}
          />
        </label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="submit" disabled={!selectedEventId || updateTemplate.isPending}>
            {updateTemplate.isPending ? 'Guardando...' : 'Guardar plantilla'}
          </button>
          <button
            type="button"
            className="button--ghost"
            onClick={() => setTemplate(defaultTemplateState)}
            disabled={!selectedEventId}
          >
            Restablecer
          </button>
        </div>
      </form>

      <section style={{ marginTop: '1.5rem' }}>
        <h4>Preview en tiempo real</h4>
        <p className="text-subtle">Arrastra el QR para posicionarlo. Pellizca sobre el QR para escalarlo.</p>
        <div
          ref={canvasRef}
          className="template-canvas"
          style={{
            backgroundImage: template.templateImageUrl ? `url(${template.templateImageUrl})` : undefined,
            touchAction: 'none',
          }}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div
            onPointerDown={handlePointerDown}
            className="template-qr"
            style={{
              width: `${template.qrSize * 100}%`,
              paddingBottom: `${template.qrSize * 100}%`,
              left: `${template.qrPositionX * 100}%`,
              top: `${template.qrPositionY * 100}%`,
              cursor: selectedEventId ? 'grab' : 'not-allowed',
            }}
          >
            QR
          </div>
        </div>
      </section>
    </div>
  )
}
