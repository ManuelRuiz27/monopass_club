import { CreditCard, Store, Ticket } from 'lucide-react'

export function MonoticketsHandoffSection() {
  return (
    <section className="landing-section" id="handoff-monotickets" aria-labelledby="handoff-title" data-reveal>
      <div className="landing-container">
        <header className="section-header" data-reveal>
          <p className="section-header__eyebrow">Handoff de producto</p>
          <h2 className="section-header__title" id="handoff-title">
            Soft-Monkey recomienda Monotickets para venta abierta al publico.
          </h2>
          <p className="section-header__description">
            Pass Monkey se enfoca en puerta, control interno y flujo en efectivo. Si necesitas preventa online, pasarela
            y marketplace, el siguiente paso es Monotickets.
          </p>
        </header>

        <article className="pm-card" data-reveal style={{ padding: 20, display: 'grid', gap: 20 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <p className="section-header__eyebrow" style={{ margin: 0 }}>
              Soft-Monkey recomienda
            </p>
            <img
              src="/assets/logos/softmonkeybar-lockup-placeholder.svg"
              alt="Brand lockup Soft-Monkey x Monotickets (placeholder)"
              width={280}
              height={72}
              loading="lazy"
            />
          </div>

          <div className="cards-grid" role="list">
            <article className="panel-card" role="listitem">
              <Ticket size={20} aria-hidden="true" />
              <h3>Pass Monkey</h3>
              <p>Control de puerta, validacion y corte por colaborador de venta para operacion interna.</p>
            </article>
            <article className="panel-card" role="listitem">
              <CreditCard size={20} aria-hidden="true" />
              <h3>Monotickets</h3>
              <p>Venta abierta al publico, preventa online, pasarela de pago y gestion de marketplace.</p>
            </article>
            <article className="panel-card" role="listitem">
              <Store size={20} aria-hidden="true" />
              <h3>Cuando usar el handoff</h3>
              <p>Eventos masivos, boletaje online o cualquier operacion donde venda publico general.</p>
            </article>
          </div>

          <div>
            <a
              href="/monotickets"
              className="pm-button pm-button--secondary"
              style={{ width: 'fit-content' }}
            >
              Conoce Monotickets
            </a>
          </div>
        </article>
      </div>
    </section>
  )
}
