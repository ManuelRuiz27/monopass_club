export function Benefits() {
  return (
    <section className="section-dark" id="beneficios">
      <div className="container content-stack">
        <h2 className="section-title">Modo rave: vendes mejor y controlas mas</h2>
        <p className="section-subtitle">
          Cambia boletos impresos y tablas eternas por una operacion que se siente premium desde la fila.
        </p>
        <div className="bento-grid">
          <article className="panel-card panel-card--bento panel-card--wide">
            <img
              src="/assets/logos/pass-monkey-mascot-3d.png"
              alt=""
              aria-hidden="true"
              className="benefit__stamp"
            />
            <span className="panel-tag">Anti-Fraude</span>
            <h3>Bloquea clonaciones, reingresos y boletos revividos.</h3>
            <p>Validacion con trazabilidad por escaneo, hora y responsable en puerta.</p>
          </article>
          <article className="panel-card panel-card--bento">
            <span className="panel-tag">QR Dinamico</span>
            <h3>Codigo vivo que cambia para evitar copias.</h3>
            <p>Tu preventa se mueve rapido y la fila avanza sin friccion.</p>
          </article>
          <article className="panel-card panel-card--bento">
            <span className="panel-tag">Multi-Rol</span>
            <h3>Manager, RP y staff en una sola consola.</h3>
            <p>Sin tablas paralelas ni WhatsApps infinitos para cuadrar accesos.</p>
          </article>
        </div>
      </div>
    </section>
  )
}
