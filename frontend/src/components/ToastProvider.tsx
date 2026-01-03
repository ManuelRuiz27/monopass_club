import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

type ToastVariant = 'success' | 'error' | 'info'

export type ToastOptions = {
  title: string
  description?: string
  variant?: ToastVariant
  durationMs?: number
}

type ToastRecord = ToastOptions & { id: string; variant: ToastVariant }

type ToastContextValue = {
  showToast: (options: ToastOptions) => void
  dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

const DEFAULT_DURATION = 4500

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([])
  const timers = useRef(new Map<string, number>())

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
    const timerId = timers.current.get(id)
    if (timerId) {
      window.clearTimeout(timerId)
      timers.current.delete(id)
    }
  }, [])

  const showToast = useCallback(
    (options: ToastOptions) => {
      const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `toast-${Date.now()}`
      const record: ToastRecord = {
        id,
        title: options.title,
        description: options.description,
        variant: options.variant ?? 'info',
        durationMs: options.durationMs ?? DEFAULT_DURATION,
      }
      setToasts((prev) => [...prev, record])
      const timerId = window.setTimeout(() => dismissToast(id), record.durationMs)
      timers.current.set(id, timerId)
    },
    [dismissToast],
  )

  const value = useMemo<ToastContextValue>(() => ({ showToast, dismissToast }), [showToast, dismissToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.variant}`}>
            <div>
              <strong>{toast.title}</strong>
              {toast.description ? <p>{toast.description}</p> : null}
            </div>
            <button type="button" aria-label="Cerrar notificacion" onClick={() => dismissToast(toast.id)}>
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast debe usarse dentro de ToastProvider')
  }
  return ctx
}
