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
        } else {
            dialog.close()
        }
    }, [isOpen])

    useEffect(() => {
        const dialog = dialogRef.current
        if (!dialog) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose()
            }
        }

        dialog.addEventListener('keydown', handleKeyDown)
        return () => dialog.removeEventListener('keydown', handleKeyDown)
    }, [onClose])

    const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
        if (e.target === dialogRef.current) {
            onClose()
        }
    }

    const sizeClass = `modal--${size}`

    return (
        <dialog ref={dialogRef} className={`modal ${sizeClass}`} onClick={handleBackdropClick}>
            <div className="modal__content">
                {title && (
                    <header className="modal__header">
                        <h3 style={{ margin: 0 }}>{title}</h3>
                        <button type="button" className="modal__close" onClick={onClose} aria-label="Cerrar">
                            ✕
                        </button>
                    </header>
                )}
                <div className="modal__body">{children}</div>
            </div>
        </dialog>
    )
}
