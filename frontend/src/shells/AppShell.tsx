import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import type { UserRole } from '@/features/auth/AuthContext'

const navByRole: Record<UserRole, Array<{ to: string; label: string; icon: string }>> = {
  MANAGER: [
    { to: '/manager', label: 'Dashboard', icon: 'dashboard' },
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
    { to: '/scanner/cuts', label: 'Cortes', icon: 'analytics' },
  ],
  DIRECTOR: [
    { to: '/director', label: 'Dashboard', icon: 'dashboard' },
    { to: '/director/comparative', label: 'Comparativo', icon: 'query_stats' },
    { to: '/director/historical', label: 'Historicas', icon: 'timeline' },
    { to: '/director/reports', label: 'Reportes', icon: 'description' },
  ],
}

const secondaryNav: Record<UserRole, Array<{ to: string; label: string; icon: string }>> = {
  MANAGER: [
    { to: '/manager/template', label: 'Plantilla', icon: 'image' },
    { to: '/manager/settings', label: 'Config', icon: 'settings' },
  ],
  RP: [],
  SCANNER: [],
  DIRECTOR: [{ to: '/director/status', label: 'Estados', icon: 'insights' }],
}

export function AppShell() {
  const { session, logout } = useAuth()
  const role: UserRole = session?.role ?? 'MANAGER'
  const navItems = navByRole[role]
  const secondaryItems = secondaryNav[role]

  return (
    <div className="app-shell-unified">
      <header className="app-header">
        <h1 className="app-brand">MonoPass</h1>
        <div className="app-user">
          <span className="text-muted">{session?.userId ?? 'Usuario'}</span>
          <button className="button--ghost app-user__logout" onClick={logout}>
            Salir
          </button>
        </div>
      </header>

      <nav className="app-bottom-nav">
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
        {secondaryItems.length > 0 && secondaryItems.map((item) => (
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

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
