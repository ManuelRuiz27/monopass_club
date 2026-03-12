import { useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui'
import { optimizeTemplateImage, readFileAsDataUrl } from '@/lib/templateImage'

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
  onConfigChange?: (config: TemplateConfig) => void
  isSaving?: boolean
  eventName?: string
  hideActions?: boolean
  compactMode?: boolean
}

const clampValue = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
const clampPosition = (value: number, size: number) => {
  const half = size / 2
  const min = clampValue(half, 0, 0.5)
  const max = 1 - min
  return clampValue(value, min, max)
}

export function TemplateEditor({
  initialConfig,
  onSave,
  onCancel,
  onConfigChange,
  isSaving,
  eventName,
  hideActions = false,
  compactMode = false,
}: TemplateEditorProps) {
  const [template, setTemplate] = useState<TemplateConfig>(() => ({
    ...defaultTemplateConfig,
    ...initialConfig,
  }))
  const [isDragging, setIsDragging] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const dragPointerId = useRef<number | null>(null)
  const pointerPositions = useRef(new Map<number, { x: number; y: number }>())
  const pinchState = useRef<{ distance: number; size: number } | null>(null)

  const applyTemplate = (updater: (previous: TemplateConfig) => TemplateConfig) => {
    setTemplate((previous) => {
      const next = updater(previous)
      onConfigChange?.(next)
      return next
    })
  }

  const handleImageUpload = async (file: File | null) => {
    if (!file) return
    try {
      const templateImageUrl = await optimizeTemplateImage(file)
      applyTemplate((previous) => ({ ...previous, templateImageUrl }))
    } catch {
      const templateImageUrl = await readFileAsDataUrl(file)
      applyTemplate((previous) => ({ ...previous, templateImageUrl }))
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      void handleImageUpload(file)
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
      applyTemplate((previous) => ({
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
    applyTemplate((previous) => ({
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
    onConfigChange?.(defaultTemplateConfig)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    onSave(template)
  }

  const updateQrSize = (nextSize: number) => {
    applyTemplate((previous) => ({
      ...previous,
      qrSize: nextSize,
      qrPositionX: clampPosition(previous.qrPositionX, nextSize),
      qrPositionY: clampPosition(previous.qrPositionY, nextSize),
    }))
  }

  const qrSizePercent = `${Math.round(template.qrSize * 100)}%`
  const title = `Editar plantilla ${eventName ? `- ${eventName}` : ''}`
  const subtitle = 'Arrastra una imagen y posiciona el QR donde aparecera en el ticket.'

  return (
    <div className="template-editor">
      {!compactMode ? (
        <header className="template-editor__header">
          <h4 className="template-editor__title">{title}</h4>
          <p className="text-muted template-editor__subtitle">{subtitle}</p>
        </header>
      ) : null}

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
              <p>{compactMode ? 'Arrastra tu imagen aqui' : 'Arrastra una imagen aqui'}</p>
              <span className="text-muted">o</span>
              <label className="button button--ghost template-editor__file-trigger">
                {compactMode ? 'Subir imagen' : 'Seleccionar archivo'}
                <input
                  className="template-editor__file-input"
                  type="file"
                  accept="image/*"
                  onChange={(event) => void handleImageUpload(event.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          ) : (
            <div className="template-editor__loaded">
              <span className="badge badge--success">{compactMode ? 'Imagen cargada' : 'Imagen cargada'}</span>
              <label className="button button--ghost template-editor__file-trigger template-editor__file-trigger--compact">
                {compactMode ? 'Cambiar imagen' : 'Cambiar imagen'}
                <input
                  className="template-editor__file-input"
                  type="file"
                  accept="image/*"
                  onChange={(event) => void handleImageUpload(event.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          )}
        </div>

        <section className="template-editor__preview">
          {!compactMode ? (
            <>
              <h5 className="template-editor__preview-title">Preview</h5>
              <p className="text-subtle template-editor__preview-hint">Arrastra el QR para posicionarlo. Pellizca para escalar.</p>
            </>
          ) : null}
          <div className="template-editor__preview-stage">
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
            <div className="template-editor__preview-slider" title={`Tamano QR: ${qrSizePercent}`}>
              <input
                type="range"
                className="template-editor__size-slider template-editor__size-slider--vertical"
                min={MIN_QR_SIZE}
                max={MAX_QR_SIZE}
                step={0.01}
                value={template.qrSize}
                onChange={(event) => updateQrSize(Number(event.target.value))}
                aria-label="Tamano del QR"
              />
            </div>
          </div>
        </section>

        {!hideActions ? (
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
        ) : null}
      </form>
    </div>
  )
}
