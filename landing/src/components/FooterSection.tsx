export function FooterSection() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer" id="footer" aria-label="Footer" data-reveal>
      <div className="landing-container footer__layout">
        <div className="footer__brand">
          <img
            src="/assets/logos/pass-monkey-lockup-3d.png"
            alt="Pass Monkey"
            width={168}
            height={44}
            className="footer__brand-logo"
          />
          <div>
            <p className="footer__title">Pass Monkey</p>
            <p className="footer__subtitle">Control profesional de acceso para eventos.</p>
          </div>
        </div>

        <nav className="footer__nav" aria-label="Legal y contacto">
          <a href="/legal/aviso-privacidad">Aviso de Privacidad</a>
          <a href="/legal/terminos">Terminos y condiciones</a>
          <a href="mailto:soporte@passmonkey.mx">Contacto</a>
        </nav>

        <div className="footer__legal">
          <span>© {year} Pass Monkey. Todos los derechos reservados.</span>
          <a href="mailto:soporte@passmonkey.mx">soporte@passmonkey.mx</a>
        </div>
      </div>
    </footer>
  )
}



