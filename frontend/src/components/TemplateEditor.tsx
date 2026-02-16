import { useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui'

const MIN_QR_SIZE = 0.1
const MAX_QR_SIZE = 0.8

export type TemplateConfig = {
  templateImageUrl: string
  qrPositionX: number
  qrPositionY: number
  qrSize: number
}

const defaultTemplateConfig: TemplateConfig = {
  templateImageUrl: '',
  qrPositionX: 0.5,
  qrPositionY: 0.5,
  qrSize: 0.35,
}

type TemplateEditorProps = {
  initialConfig?: Partial<TemplateConfig>
  onSave: (config: TemplateConfig) => void
  onCancel: () => void
  isSaving?: boolean
  eventName?: string
}

const clampValue = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
const clampPosition = (value: number, size: number) => {
  const half = size / 2
  const min = clampValue(half, 0, 0.5)
  const max = 1 - min
  return clampValue(value, min, max)
}

export function TemplateEditor({ initialConfig, onSave, onCancel, isSaving, eventName }: TemplateEditorProps) {
  const [template, setTemplate] = useState<TemplateConfig>(() => ({
    ...defaultTemplateConfig,
    ...initialConfig,
  }))
  const [isDragging, setIsDragging] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const dragPointerId = useRef<number | null>(null)
  const pointerPositions = useRef(new Map<number, { x: number; y: number }>())
  const pinchState = useRef<{ distance: number; size: number } | null>(null)

  const handleImageUpload = (file: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setTemplate((previous) => ({ ...previous, templateImageUrl: reader.result as string }))
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file)
    }
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return
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
    setTemplate((previous) => ({ ...previous, qrPositionX: Number(nextX.toFixed(3)), qrPositionY: Number(nextY.toFixed(3)) }))
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    pointerPositions.current.delete(event.pointerId)
    if (canvasRef.current) {
      try {
        canvasRef.current.releasePointerCapture(event.pointerId)
      } catch {
        // Ignore browser pointer release errors.
      }
    }
    setIsDragging(false)
    dragPointerId.current = null
    if (pointerPositions.current.size < 2) {
      pinchState.current = null
    }
  }

  const handleReset = () => {
    setTemplate(defaultTemplateConfig)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    onSave(template)
  }

  const qrSizePercent = `${Math.round(template.qrSize * 100)}%`

  return (
    <div className="template-editor">
      <header className="template-editor__header">
        <h4 className="template-editor__title">Editar plantilla {eventName ? `- ${eventName}` : ''}</h4>
        <p className="text-muted template-editor__subtitle">Arrastra una imagen y posiciona el QR donde aparecera en el ticket.</p>
      </header>

      <form onSubmit={handleSubmit}>
        <div
          className={`template-dropzone ${template.templateImageUrl ? 'template-dropzone--has-image' : ''}`}
          onDrop={handleDrop}
          onDragOver={(event) => event.preventDefault()}
        >
          {!template.templateImageUrl ? (
            <div className="template-dropzone__content">
              <span className="material-symbols-outlined template-dropzone__icon" aria-hidden="true">
                add_photo_alternate
              </span>
              <p>Arrastra una imagen aqui</p>
              <span className="text-muted">o</span>
              <label className="button button--ghost template-editor__file-trigger">
                Seleccionar archivo
                <input
                  className="template-editor__file-input"
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleImageUpload(event.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          ) : (
            <div className="template-editor__loaded">
              <span className="badge badge--success">Imagen cargada</span>
              <label className="button button--ghost template-editor__file-trigger template-editor__file-trigger--compact">
                Cambiar imagen
                <input
                  className="template-editor__file-input"
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleImageUpload(event.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          )}
        </div>

        <div className="form-grid template-editor__size">
          <label>
            Tamano del QR ({qrSizePercent})
            <input
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
            />
          </label>
        </div>

        <section className="template-editor__preview">
          <h5 className="template-editor__preview-title">Preview</h5>
          <p className="text-subtle template-editor__preview-hint">Arrastra el QR para posicionarlo. Pellizca para escalar.</p>
          <div
            ref={canvasRef}
            className="template-canvas template-editor__canvas"
            style={{
              backgroundImage: template.templateImageUrl ? `url(${template.templateImageUrl})` : undefined,
            }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <div
              onPointerDown={handlePointerDown}
              className={`template-qr ${isDragging ? 'template-qr--dragging' : ''}`}
              style={{
                width: `${template.qrSize * 100}%`,
                paddingBottom: `${template.qrSize * 100}%`,
                left: `${template.qrPositionX * 100}%`,
                top: `${template.qrPositionY * 100}%`,
              }}
            >
              QR
            </div>
          </div>
        </section>

        <div className="template-editor__actions">
          <Button type="submit" loading={Boolean(isSaving)}>
            {isSaving ? 'Guardando...' : 'Guardar plantilla'}
          </Button>
          <Button type="button" variant="ghost" onClick={handleReset}>
            Restablecer
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}
