import type { ReactNode } from 'react'

type RpStateTone = 'neutral' | 'warning' | 'error'

type RpStateViewProps = {
  icon: string
  title: string
  description: string
  tone?: RpStateTone
  actions?: ReactNode
}

export function RpStateView({ icon, title, description, tone = 'neutral', actions }: RpStateViewProps) {
  return (
    <section className={`rp-state rp-state--${tone}`} role={tone === 'error' ? 'alert' : undefined}>
      <div className="rp-state__icon-shell" aria-hidden="true">
        <span className="material-symbols-outlined rp-state__icon">{icon}</span>
      </div>
      <h3 className="rp-state__title">{title}</h3>
      <p className="rp-state__description">{description}</p>
      {actions ? <div className="rp-state__actions">{actions}</div> : null}
    </section>
  )
}
