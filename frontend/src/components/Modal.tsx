import { useEffect, useRef, type ReactNode } from 'react'

type ModalProps = {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({ isOpen, onClose, children, title, size = 'md' }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen) {
      dialog.showModal()
      return
    }

    if (dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    dialog.addEventListener('keydown', handleKeyDown)
    return () => dialog.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target === dialogRef.current) {
      onClose()
    }
  }

  return (
    <dialog ref={dialogRef} className={`modal modal--${size}`} onClick={handleBackdropClick}>
      <div className="modal__content">
        {title ? (
          <header className="modal__header">
            <h3 className="modal__title">{title}</h3>
            <button type="button" className="modal__close" onClick={onClose} aria-label="Cerrar">
              <span className="material-symbols-outlined" aria-hidden="true">
                close
              </span>
            </button>
          </header>
        ) : null}
        <div className="modal__body">{children}</div>
      </div>
    </dialog>
  )
}
