import { Button } from './Button'

type PageLoadingStateProps = {
  message?: string
}

type PageErrorStateProps = {
  title?: string
  description: string
}

type CardEmptyStateProps = {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function PageLoadingState({ message = 'Cargando...' }: PageLoadingStateProps) {
  return (
    <section className="page-placeholder">
      <p className="text-muted">{message}</p>
    </section>
  )
}

export function PageErrorState({ title = 'Error al cargar', description }: PageErrorStateProps) {
  return (
    <section className="page-placeholder">
      <h2>{title}</h2>
      <p className="text-danger">{description}</p>
    </section>
  )
}

export function CardEmptyState({ title, description, actionLabel, onAction }: CardEmptyStateProps) {
  return (
    <section className="manager-empty-state manager-empty-state--compact card">
      <h4 className="manager-empty-state__title">{title}</h4>
      <p className="text-muted manager-empty-state__description">{description}</p>
      {actionLabel && onAction ? (
        <Button type="button" variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </section>
  )
}
