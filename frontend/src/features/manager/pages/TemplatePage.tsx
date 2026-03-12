import { useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { managerApi } from '../api'
import { useToast } from '@/components/ToastProvider'
import { Button, PageErrorState, PageLoadingState } from '@/components/ui'
import { optimizeTemplateImage, readFileAsDataUrl } from '@/lib/templateImage'

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
  const [templateFileName, setTemplateFileName] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const dragPointerId = useRef<number | null>(null)
  const pointerPositions = useRef(new Map<number, { x: number; y: number }>())
  const pinchState = useRef<{ distance: number; size: number } | null>(null)

  const clampValue = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
  const clampPosition = (value: number, size: number) => {
    const half = size / 2
    const min = clampValue(half, 0, 0.5)
    const max = 1 - min
    return clampValue(value, min, max)
  }

  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId)
    setTemplateFileName('')
    const selected = eventsQuery.data?.find((event) => event.id === eventId)
    if (!selected) {
      setTemplate(defaultTemplateState)
      return
    }
    const size = selected.qrSize ?? 0.35
    setTemplate({
      templateImageUrl: selected.templateImageUrl ?? '',
      qrPositionX: clampPosition(selected.qrPositionX ?? 0.5, size),
      qrPositionY: clampPosition(selected.qrPositionY ?? 0.5, size),
      qrSize: size,
    })
  }

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

  const handleImageUpload = async (file: File | null) => {
    if (!file) return
    setTemplateFileName(file.name)
    try {
      const templateImageUrl = await optimizeTemplateImage(file)
      setTemplate((previous) => ({ ...previous, templateImageUrl }))
    } catch {
      const templateImageUrl = await readFileAsDataUrl(file)
      setTemplate((previous) => ({ ...previous, templateImageUrl }))
    }
  }

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
      const nextSize = clampValue(pinchState.current.size * ratio, MIN_QR_SIZE, MAX_QR_SIZE)
      setTemplate((previous) => ({
        ...previous,
        qrSize: Number(nextSize.toFixed(3)),
        qrPositionX: clampPosition(previous.qrPositionX, nextSize),
        qrPositionY: clampPosition(previous.qrPositionY, nextSize),
      }))
      return
    }

    if (!isDragging || dragPointerId.current !== event.pointerId) return
    const nextX = clampPosition((event.clientX - rect.left) / rect.width, template.qrSize)
    const nextY = clampPosition((event.clientY - rect.top) / rect.height, template.qrSize)
    setTemplate((previous) => ({
      ...previous,
      qrPositionX: Number(nextX.toFixed(3)),
      qrPositionY: Number(nextY.toFixed(3)),
    }))
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    pointerPositions.current.delete(event.pointerId)
    if (canvasRef.current) {
      try {
        canvasRef.current.releasePointerCapture(event.pointerId)
      } catch {
        // noop
      }
    }
    setIsDragging(false)
    dragPointerId.current = null
    if (pointerPositions.current.size < 2) {
      pinchState.current = null
    }
  }

  const selectedEvent = useMemo(
    () => eventsQuery.data?.find((event) => event.id === selectedEventId) ?? null,
    [eventsQuery.data, selectedEventId],
  )

  const qrSizePercent = `${Math.round(template.qrSize * 100)}%`
  const qrPosX = `${Math.round(template.qrPositionX * 100)}%`
  const qrPosY = `${Math.round(template.qrPositionY * 100)}%`

  const handleReset = () => {
    if (!selectedEventId) {
      setTemplate(defaultTemplateState)
      setTemplateFileName('')
      return
    }
    handleSelectEvent(selectedEventId)
  }

  if (eventsQuery.isLoading) {
    return <PageLoadingState message="Cargando eventos..." />
  }

  if (eventsQuery.error) {
    return <PageErrorState description="No se pudieron cargar los eventos." />
  }

  return (
    <div className="manager-template-page">
      <header className="manager-template-page__header">
        <div>
          <h3 className="manager-template-page__title">Plantilla / QR</h3>
          <p className="text-muted manager-template-page__subtitle">
            Sube imagen base, posiciona el QR y ajusta escala para cada evento.
          </p>
        </div>
      </header>

      <div className="manager-template-layout">
        <section className="card manager-template-controls">
          <form
            className="form-grid manager-template-form"
            onSubmit={(event) => {
              event.preventDefault()
              updateTemplate.mutate()
            }}
          >
            <label>
              Evento
              <select value={selectedEventId} onChange={(event) => handleSelectEvent(event.target.value)} required>
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
              <div className="manager-template-file">
                <label
                  className={`button button--ghost manager-template-file__trigger ${!selectedEventId ? 'manager-template-file__trigger--disabled' : ''}`}
                >
                  {template.templateImageUrl ? 'Cambiar imagen' : 'Subir imagen'}
                  <input
                    className="manager-template-file__input"
                    type="file"
                    accept="image/*"
                    onChange={(event) => void handleImageUpload(event.target.files?.[0] ?? null)}
                    disabled={!selectedEventId}
                  />
                </label>
                <span className="text-muted manager-template-file__name">
                  {templateFileName || (template.templateImageUrl ? 'Imagen cargada' : 'Sin archivo seleccionado')}
                </span>
              </div>
            </label>

            <label>
              Escala QR ({qrSizePercent})
              <input
                className="manager-template-range"
                type="range"
                min={MIN_QR_SIZE}
                max={MAX_QR_SIZE}
                step={0.01}
                value={template.qrSize}
                onChange={(event) => {
                  const nextSize = Number(event.target.value)
                  setTemplate((previous) => ({
                    ...previous,
                    qrSize: nextSize,
                    qrPositionX: clampPosition(previous.qrPositionX, nextSize),
                    qrPositionY: clampPosition(previous.qrPositionY, nextSize),
                  }))
                }}
                disabled={!selectedEventId}
              />
            </label>

            <div className="manager-template-form__actions">
              <Button type="submit" loading={updateTemplate.isPending} disabled={!selectedEventId}>
                {updateTemplate.isPending ? 'Guardando...' : 'Guardar plantilla'}
              </Button>
              <Button type="button" variant="ghost" onClick={handleReset} disabled={!selectedEventId}>
                Restablecer
              </Button>
            </div>
          </form>
        </section>

        <section className="card manager-template-preview">
          <header className="manager-template-preview__header">
            <h4 className="manager-template-preview__title">Preview en tiempo real</h4>
            {selectedEvent ? <span className="badge">{selectedEvent.name}</span> : null}
          </header>
          <p className="text-muted manager-template-preview__hint">Arrastra para posicionar y pellizca para escalar.</p>

          <div
            ref={canvasRef}
            className="template-canvas manager-template-preview__canvas"
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
              className="template-qr manager-template-preview__qr"
              style={{
                width: `${template.qrSize * 100}%`,
                paddingBottom: `${template.qrSize * 100}%`,
                left: `${template.qrPositionX * 100}%`,
                top: `${template.qrPositionY * 100}%`,
                cursor: selectedEventId ? (isDragging ? 'grabbing' : 'grab') : 'not-allowed',
              }}
            >
              QR
            </div>
          </div>

          <div className="manager-template-preview__meta text-muted">
            <span>X: {qrPosX}</span>
            <span>Y: {qrPosY}</span>
            <span>Tamano: {qrSizePercent}</span>
          </div>
        </section>
      </div>
    </div>
  )
}
