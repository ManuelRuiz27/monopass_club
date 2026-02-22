const socialLinks = [
  { label: 'Instagram', href: 'https://instagram.com/passmonkeymx' },
  { label: 'TikTok', href: 'https://tiktok.com/@passmonkeymx' },
  { label: 'LinkedIn', href: 'https://linkedin.com/company/pass-monkey' },
]

export function FooterSection() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer" id="footer" aria-label="Footer" data-reveal>
      <div className="landing-container footer__layout">
        <div className="footer__brand">
          <img src="/assets/logos/pass-monckey-iso-clean.png" alt="Pass Monkey" width={44} height={44} />
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

        <div className="footer__social" aria-label="Redes sociales">
          {socialLinks.map((item) => (
            <a key={item.label} href={item.href} target="_blank" rel="noreferrer">
              {item.label}
            </a>
          ))}
        </div>

        <div className="footer__legal">
          <span>© {year} Pass Monkey. Todos los derechos reservados.</span>
          <a href="mailto:soporte@passmonkey.mx">soporte@passmonkey.mx</a>
        </div>
      </div>
    </footer>
  )
}

