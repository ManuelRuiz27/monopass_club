type ToastVariant = 'success' | 'error' | 'info' | 'warning'

export type ToastProps = {
  title: string
  description?: string
  variant?: ToastVariant
  onClose?: () => void
}

export function Toast({ title, description, variant = 'info', onClose }: ToastProps) {
  return (
    <div className={`ui-toast ui-toast--${variant}`} role="status" aria-live="polite">
      <div>
        <p className="ui-toast__title">
          <strong>{title}</strong>
        </p>
        {description ? <p className="ui-toast__description">{description}</p> : null}
      </div>
      {onClose ? (
        <button type="button" className="ui-toast__close" aria-label="Cerrar notificacion" onClick={onClose}>
          x
        </button>
      ) : null}
    </div>
  )
}
