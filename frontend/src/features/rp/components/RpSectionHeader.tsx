type RpSectionHeaderProps = {
  eyebrow: string
  title: string
  description?: string
  className?: string
}

export function RpSectionHeader({ eyebrow, title, description, className }: RpSectionHeaderProps) {
  return (
    <header className={className ? `rp-landing-header ${className}` : 'rp-landing-header'}>
      <p className="rp-landing-header__eyebrow">{eyebrow}</p>
      <h2 className="rp-landing-header__title">{title}</h2>
      {description ? <p className="rp-landing-header__description">{description}</p> : null}
    </header>
  )
}
