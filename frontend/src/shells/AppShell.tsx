import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import type { UserRole } from '@/features/auth/AuthContext'

const navByRole: Record<'MANAGER' | 'RP' | 'SCANNER', Array<{ to: string; label: string }>> = {
  MANAGER: [{ to: '/manager', label: 'Manager' }],
  RP: [{ to: '/rp', label: 'RP' }],
  SCANNER: [{ to: '/scanner', label: 'Scanner' }],
}

const roleDescriptions: Record<'MANAGER' | 'RP' | 'SCANNER', string> = {
  MANAGER: 'Gestiona clubs, eventos, staff y cortes en vivo.',
  RP: 'Genera accesos y consulta historial de invitados.',
  SCANNER: 'Valida y confirma accesos desde el microservicio dedicado.',
}

const breadcrumbLabels: Record<string, string> = {
  manager: 'Manager',
  rp: 'RP',
  scanner: 'Scanner',
  clubs: 'Clubs',
  events: 'Eventos',
  template: 'Plantilla QR',
  rps: 'RPs',
  'scanner-staff': 'Staff Scanner',
  cuts: 'Cortes',
  settings: 'Settings',
  generate: 'Generar acceso',
  history: 'Historial',
}

export function AppShell() {
  const { session, logout } = useAuth()
  const location = useLocation()
  const role: UserRole = session?.role ?? 'MANAGER'
  const navItems = navByRole[role]
  const segments = location.pathname.split('/').filter(Boolean)
  const breadcrumbItems =
    segments.length === 0
      ? [{ label: 'Inicio', to: '/' }]
      : segments.map((segment, index) => {
          const to = `/${segments.slice(0, index + 1).join('/')}`
          const rawLabel = breadcrumbLabels[segment] ?? segment.replace(/-/g, ' ')
          const label = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1)
          return { label, to }
        })

  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar">
        <div>
          <h1 className="app-shell__brand">MonoPass Club</h1>
          <p className="app-shell__role text-muted">{roleDescriptions[role]}</p>
        </div>
        <div className="app-shell__nav-group">
          <span className="app-shell__nav-label">Principal</span>
          <nav className="app-shell__nav">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'active' : undefined)}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        {session ? (
          <div className="app-shell__sidebar-footer">
            <p className="app-shell__meta text-muted">Usuario: {session.userId}</p>
            <p className="app-shell__meta text-muted">Rol: {session.role}</p>
            <button className="button--ghost" style={{ width: '100%' }} onClick={logout}>
              Cerrar sesion
            </button>
          </div>
        ) : null}
      </aside>
      <main className="app-shell__content">
        <header className="app-shell__header">
          <nav className="app-shell__breadcrumbs" aria-label="Breadcrumb">
            <ol>
              {breadcrumbItems.map((item, index) => {
                const isLast = index === breadcrumbItems.length - 1
                return (
                  <li key={item.to}>
                    {isLast ? <span>{item.label}</span> : <NavLink to={item.to}>{item.label}</NavLink>}
                  </li>
                )
              })}
            </ol>
          </nav>
        </header>
        <div className="app-shell__content-inner">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
