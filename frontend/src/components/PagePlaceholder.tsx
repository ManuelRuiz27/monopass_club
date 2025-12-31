import type { ReactNode } from 'react'

interface PagePlaceholderProps {
  title: string
  description: string
  hint?: ReactNode
}

export function PagePlaceholder({ title, description, hint }: PagePlaceholderProps) {
  return (
    <section className="page-placeholder">
      <h2>{title}</h2>
      <p>{description}</p>
      {hint ? <div style={{ marginTop: '1rem' }}>{hint}</div> : null}
    </section>
  )
}