import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import type { UserRole } from '@/features/auth/AuthContext'
import { useGsapInteractiveScale } from '@/lib/motion/useGsapInteractiveScale'
import { usePrefersReducedMotion } from '@/lib/motion/usePrefersReducedMotion'

const navByRole: Record<UserRole, Array<{ to: string; label: string; icon: string }>> = {
  MANAGER: [
    { to: '/manager', label: 'Dashboard', icon: 'dashboard' },
    { to: '/manager/live', label: 'Live', icon: 'monitor_heart' },
    { to: '/manager/team', label: 'Equipo', icon: 'groups' },
    { to: '/manager/events', label: 'Eventos', icon: 'event' },
    { to: '/manager/cuts', label: 'Cortes', icon: 'monitoring' },
  ],
  RP: [
    { to: '/rp/events', label: 'Generar', icon: 'qr_code' },
    { to: '/rp/history', label: 'Historial', icon: 'history' },
    { to: '/rp/profile', label: 'Perfil', icon: 'person' },
  ],
  SCANNER: [
    { to: '/scanner', label: 'Escanear', icon: 'qr_code_scanner' },
  ],
  DIRECTOR: [
    { to: '/director', label: 'Dashboard', icon: 'dashboard' },
    { to: '/director/revenue', label: 'Monetizacion', icon: 'paid' },
    { to: '/director/managers', label: 'Managers', icon: 'manage_accounts' },
    { to: '/director/comparative', label: 'Comparativo', icon: 'query_stats' },
    { to: '/director/historical', label: 'Historicas', icon: 'timeline' },
    { to: '/director/reports', label: 'Reportes', icon: 'description' },
  ],
}

const secondaryNav: Record<UserRole, Array<{ to: string; label: string; icon: string }>> = {
  MANAGER: [
    { to: '/manager/settings', label: 'Config', icon: 'settings' },
  ],
  RP: [],
  SCANNER: [],
  DIRECTOR: [
    { to: '/director/plans', label: 'Planes', icon: 'sell' },
    { to: '/director/subscriptions', label: 'Subs', icon: 'subscriptions' },
    { to: '/director/billing', label: 'Billing', icon: 'receipt_long' },
    { to: '/director/finance', label: 'Finanzas', icon: 'calculate' },
    { to: '/director/status', label: 'Estados', icon: 'insights' },
  ],
}

const roleHeaderCopy: Record<UserRole, { label: string; subtitle: string; pill: string; fallbackName: string }> = {
  MANAGER: {
    label: 'Operacion de club',
    subtitle: 'Control de aforo, ventas y equipo en una vista',
    pill: 'MANAGER APP',
    fallbackName: 'Gerardo Alvarez',
  },
  RP: {
    label: 'RP Sales Control',
    subtitle: 'Convierte tu flyer en acceso y acelera ventas',
    pill: 'RP APP',
    fallbackName: 'Sofia Ramirez',
  },
  SCANNER: {
    label: 'Control de puerta',
    subtitle: 'Validacion rapida y fila en movimiento',
    pill: 'STAFF APP',
    fallbackName: 'Axel Cruz',
  },
  DIRECTOR: {
    label: 'Vista directiva',
    subtitle: 'Lectura consolidada del negocio',
    pill: 'DIRECTOR APP',
    fallbackName: 'Valeria Torres',
  },
}

function resolveDisplayName(rawUserId: string | undefined, role: UserRole) {
  const fallback = roleHeaderCopy[role].fallbackName
  if (!rawUserId) return fallback

  const normalized = rawUserId.trim()
  if (!normalized) return fallback

  const isUuidLike = normalized.length >= 24 && normalized.includes('-')
  if (isUuidLike) return fallback

  const cleaned = normalized.replace(/[._-]+/g, ' ').trim()
  if (!cleaned) return fallback

  return cleaned
    .split(' ')
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function AppShell() {
  const { session, logout } = useAuth()
  const location = useLocation()
  const bottomNavRef = useRef<HTMLElement | null>(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const role: UserRole = session?.role ?? 'MANAGER'
  const isScannerRole = role === 'SCANNER'
  const navItems = navByRole[role]
  const secondaryItems = secondaryNav[role]
  const headerCopy = roleHeaderCopy[role]
  const displayName = resolveDisplayName(session?.userId, role)

  useGsapInteractiveScale(bottomNavRef, '.bottom-nav-item', role, {
    hoverScale: role === 'DIRECTOR' ? 1 : 1.03,
    pressScale: role === 'DIRECTOR' ? 1 : 0.97,
  })

  useLayoutEffect(() => {
    if (prefersReducedMotion || role === 'DIRECTOR') return

    const activeItem = bottomNavRef.current?.querySelector<HTMLElement>('.bottom-nav-item.active')
    if (!activeItem) return

    const timeline = gsap.timeline({ defaults: { ease: 'power2.out' } })
    timeline
      .fromTo(activeItem, { scale: 0.96, autoAlpha: 0.88 }, { scale: 1, autoAlpha: 1, duration: 0.22 })
      .fromTo(
        activeItem.querySelector('.bottom-nav-icon'),
        { y: 2 },
        { y: 0, duration: 0.18, clearProps: 'transform' },
        0,
      )

    return () => {
      timeline.kill()
    }
  }, [location.pathname, prefersReducedMotion, role])

  return (
    <div className={`app-shell-unified app-shell-unified--${role.toLowerCase()}`}>
      <header className={`app-header${isScannerRole ? ' app-header--scanner' : ''}`}>
        <div className={`app-brand-wrap${isScannerRole ? ' app-brand-wrap--scanner' : ''}`}>
          <img
            className={`app-brand-logo${isScannerRole ? ' app-brand-logo--scanner' : ''}`}
            src="/assets/logos/pass-monkey-neon-letters.png"
            alt="Pass Monkey"
          />
          {isScannerRole ? (
            <p className="app-brand-title app-brand-title--scanner">Scanner</p>
          ) : (
            <>
              <div className="app-brand-copy">
                <p className="app-brand-title">{headerCopy.label}</p>
                <p className="app-brand-subtitle">{headerCopy.subtitle}</p>
              </div>
              <span className={`app-role-pill app-role-pill--${role.toLowerCase()}`}>{headerCopy.pill}</span>
            </>
          )}
        </div>
        <div className={`app-user${isScannerRole ? ' app-user--scanner' : ''}`}>
          {!isScannerRole ? (
            <div className="app-user__meta">
              <span className="app-user__name">{displayName}</span>
            </div>
          ) : null}
          <button className="button--ghost app-user__logout" onClick={logout}>
            {isScannerRole ? 'Cerrar sesion' : 'Salir'}
          </button>
        </div>
      </header>

      {!isScannerRole ? (
        <nav ref={bottomNavRef} className="app-bottom-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/manager' || item.to === '/rp' || item.to === '/scanner' || item.to === '/director'}
              className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="material-symbols-outlined bottom-nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="bottom-nav-label">{item.label}</span>
            </NavLink>
          ))}
          {secondaryItems.length > 0 &&
            secondaryItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `bottom-nav-item bottom-nav-item--secondary ${isActive ? 'active' : ''}`}
              >
                <span className="material-symbols-outlined bottom-nav-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="bottom-nav-label">{item.label}</span>
              </NavLink>
            ))}
        </nav>
      ) : null}

      <main className={`app-main${isScannerRole ? ' app-main--scanner' : ''}`}>
        <Outlet />
      </main>
    </div>
  )
}
