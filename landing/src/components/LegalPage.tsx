type LegalPageType = 'privacy' | 'terms'

type LegalPageProps = {
  type: LegalPageType
}

const legalContent: Record<LegalPageType, { title: string; intro: string; blocks: Array<{ heading: string; body: string }> }> =
  {
    privacy: {
      title: 'Aviso de privacidad',
      intro: 'Pass Monkey utiliza datos de contacto y operacion para brindar acceso al servicio y soporte.',
      blocks: [
        {
          heading: 'Datos recabados',
          body: 'Nombre, telefono, correo y datos de club/evento se recaban para contacto comercial, provision de cuenta y soporte operativo.',
        },
        {
          heading: 'Uso de la informacion',
          body: 'La informacion se usa para gestionar altas, pagos, notificaciones operativas y mejora del servicio.',
        },
        {
          heading: 'Conservacion y seguridad',
          body: 'Los datos se almacenan con controles de acceso y trazabilidad. Puedes solicitar actualizacion o baja por canales oficiales.',
        },
      ],
    },
    terms: {
      title: 'Terminos de servicio',
      intro: 'El uso de Pass Monkey implica aceptacion de terminos operativos y de pago vigentes.',
      blocks: [
        {
          heading: 'Alcance del servicio',
          body: 'Pass Monkey provee herramientas de control de acceso, escaneo y auditoria para eventos.',
        },
        {
          heading: 'Pagos y activacion',
          body: 'La activacion por evento y los planes mensuales se rigen por precios publicados en la landing y contrato comercial vigente.',
        },
        {
          heading: 'Responsabilidad del organizador',
          body: 'El organizador es responsable de la operacion en puerta, conectividad y uso adecuado de cuentas asignadas.',
        },
      ],
    },
  }

export function LegalPage({ type }: LegalPageProps) {
  const content = legalContent[type]

  return (
    <main className="legal-page">
      <section className="section-dark">
        <div className="container content-stack">
          <a className="legal-back" href="/">
            Volver a landing
          </a>
          <h1 className="section-title">{content.title}</h1>
          <p className="section-subtitle">{content.intro}</p>
          <div className="cards-grid">
            {content.blocks.map((block) => (
              <article key={block.heading} className="panel-card">
                <h3>{block.heading}</h3>
                <p>{block.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

