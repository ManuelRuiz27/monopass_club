type StatusMode = 'construction' | 'not-found'

function StatusReferencePage({ mode }: { mode: StatusMode }) {
  const isConstruction = mode === 'construction'
  const eyebrow = isConstruction ? 'Monotickets' : 'Error 404'
  const title = isConstruction ? 'Marketplace en construccion' : 'No encontramos este evento'
  const subtitle = isConstruction
    ? 'Mono esta trabajando en ello. Estara disponible pronto.'
    : 'Revisa el enlace o vuelve al inicio.'

  return (
    <main className="status-page">
      <section className="status-page__canvas" aria-labelledby="status-page-title">
        <div className="landing-container status-page__content">
          <header className="status-page__copy">
            <p className="status-page__eyebrow">{eyebrow}</p>
            <h1 className="status-page__title" id="status-page-title">{title}</h1>
            <p className="status-page__subtitle">{subtitle}</p>
          </header>

          <article className="status-page__poster">
            <div className={isConstruction ? 'status-page__poster-window is-construction-window' : 'status-page__poster-window'}>
              {isConstruction ? (
                <>
                  <img
                    src="/assets/screenshots/status-construction-mono-only.png"
                    alt="Mono trabajando en el marketplace de Monotickets"
                    className="status-page__poster-image is-construction-solo"
                  />
                  <span className="status-page__work-glow" aria-hidden="true" />
                  <span className="status-page__spark status-page__spark--one" aria-hidden="true" />
                  <span className="status-page__spark status-page__spark--two" aria-hidden="true" />
                  <span className="status-page__spark status-page__spark--three" aria-hidden="true" />
                  <span className="status-page__typing" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                </>
              ) : (
                <img
                  src="/assets/screenshots/status-404-construccion-reference.png"
                  alt="Pantalla 404 de evento no encontrado"
                  className="status-page__poster-image is-not-found"
                />
              )}
            </div>
          </article>

          <div className="status-page__actions">
            {isConstruction ? (
              <>
                <a href="/#cta-final" className="pm-button pm-button--primary">
                  Agenda tu demo privada
                </a>
                <a href="/" className="pm-button pm-button--secondary">
                  Volver al inicio
                </a>
              </>
            ) : (
              <>
                <a href="/" className="pm-button pm-button--primary">
                  Volver al inicio
                </a>
                <a href="/#cta-final" className="pm-button pm-button--secondary">
                  Agenda demo
                </a>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

export function MonoticketsComingSoonPage() {
  return <StatusReferencePage mode="construction" />
}

export function NotFoundPage() {
  return <StatusReferencePage mode="not-found" />
}
