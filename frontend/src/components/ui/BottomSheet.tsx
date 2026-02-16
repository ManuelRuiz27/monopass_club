import { useEffect, type ReactNode } from 'react'

export type BottomSheetProps = {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  actions?: ReactNode
}

export function BottomSheet({ open, onClose, title, children, actions }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="ui-sheet-layer" role="presentation">
      <button type="button" className="ui-sheet-backdrop" aria-label="Cerrar panel" onClick={onClose} />
      <section className="ui-sheet" role="dialog" aria-modal="true">
        <header className="ui-sheet__header">
          {title ? <h3 className="ui-sheet__title">{title}</h3> : <span />}
          <button type="button" className="ui-sheet__close" onClick={onClose} aria-label="Cerrar panel">
            x
          </button>
        </header>
        <div className="ui-sheet__body">{children}</div>
        {actions ? <footer className="ui-sheet__footer">{actions}</footer> : null}
      </section>
    </div>
  )
}
