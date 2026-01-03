import { useRef, useState, useEffect } from 'react'

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

    useEffect(() => {
        if (initialConfig) {
            const size = initialConfig.qrSize ?? 0.35
            setTemplate({
                templateImageUrl: initialConfig.templateImageUrl ?? '',
                qrPositionX: clampPosition(initialConfig.qrPositionX ?? 0.5, size),
                qrPositionY: clampPosition(initialConfig.qrPositionY ?? 0.5, size),
                qrSize: size,
            })
        }
    }, [initialConfig])

    const handleImageUpload = (file: File | null) => {
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => {
            setTemplate((prev) => ({ ...prev, templateImageUrl: reader.result as string }))
        }
        reader.readAsDataURL(file)
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        const file = e.dataTransfer.files[0]
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
            setTemplate((prev) => ({
                ...prev,
                qrSize: Number(nextSize.toFixed(3)),
                qrPositionX: clampPosition(prev.qrPositionX, nextSize),
                qrPositionY: clampPosition(prev.qrPositionY, nextSize),
            }))
            return
        }

        if (!isDragging || dragPointerId.current !== event.pointerId) return
        const nextX = clampPosition((event.clientX - rect.left) / rect.width, template.qrSize)
        const nextY = clampPosition((event.clientY - rect.top) / rect.height, template.qrSize)
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

    const handleReset = () => {
        setTemplate(defaultTemplateConfig)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave(template)
    }

    const qrSizePercent = `${Math.round(template.qrSize * 100)}%`

    return (
        <div className="template-editor">
            <header className="template-editor__header">
                <h4 style={{ margin: 0 }}>Editar plantilla {eventName && `- ${eventName}`}</h4>
                <p className="text-muted" style={{ margin: '0.25rem 0 0' }}>
                    Arrastra una imagen y posiciona el QR donde aparecerá en el ticket.
                </p>
            </header>

            <form onSubmit={handleSubmit}>
                {/* Drop zone / Image upload */}
                <div
                    className={`template-dropzone ${template.templateImageUrl ? 'template-dropzone--has-image' : ''}`}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                >
                    {!template.templateImageUrl ? (
                        <div className="template-dropzone__content">
                            <span style={{ fontSize: '2rem' }}>📷</span>
                            <p>Arrastra una imagen aquí</p>
                            <span className="text-muted">o</span>
                            <label className="button button--ghost" style={{ cursor: 'pointer', marginTop: '0.5rem' }}>
                                Seleccionar archivo
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e.target.files?.[0] ?? null)}
                                    style={{ display: 'none' }}
                                />
                            </label>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                            <span className="badge badge--success">✓ Imagen cargada</span>
                            <label className="button button--ghost" style={{ cursor: 'pointer', fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                                Cambiar imagen
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e.target.files?.[0] ?? null)}
                                    style={{ display: 'none' }}
                                />
                            </label>
                        </div>
                    )}
                </div>

                {/* Size slider */}
                <div className="form-grid" style={{ marginTop: '1rem' }}>
                    <label>
                        Tamaño del QR ({qrSizePercent})
                        <input
                            type="range"
                            min={MIN_QR_SIZE}
                            max={MAX_QR_SIZE}
                            step={0.01}
                            value={template.qrSize}
                            onChange={(e) => {
                                const nextSize = Number(e.target.value)
                                setTemplate((prev) => ({
                                    ...prev,
                                    qrSize: nextSize,
                                    qrPositionX: clampPosition(prev.qrPositionX, nextSize),
                                    qrPositionY: clampPosition(prev.qrPositionY, nextSize),
                                }))
                            }}
                        />
                    </label>
                </div>

                {/* Canvas preview */}
                <section style={{ marginTop: '1rem' }}>
                    <h5 style={{ margin: '0 0 0.5rem' }}>Preview</h5>
                    <p className="text-subtle" style={{ margin: '0 0 0.5rem', fontSize: '0.85rem' }}>
                        Arrastra el QR para posicionarlo. Pellizca para escalar.
                    </p>
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
                                cursor: 'grab',
                            }}
                        >
                            QR
                        </div>
                    </div>
                </section>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                    <button type="submit" disabled={isSaving}>
                        {isSaving ? 'Guardando...' : 'Guardar plantilla'}
                    </button>
                    <button type="button" className="button--ghost" onClick={handleReset}>
                        Restablecer
                    </button>
                    <button type="button" className="button--ghost" onClick={onCancel}>
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    )
}
