import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import type { UserRole } from '@/features/auth/AuthContext'

// Navegación completa por rol - ahora incluye todas las secciones en un solo lugar
const navByRole: Record<UserRole, Array<{ to: string; label: string; icon: string }>> = {
  MANAGER: [
    { to: '/manager', label: 'Dashboard', icon: '📊' },
    { to: '/manager/team', label: 'Equipo', icon: '👥' }, // Lleva a TeamLayout (default Rps)
    { to: '/manager/events', label: 'Eventos', icon: '📅' },
    { to: '/manager/cuts', label: 'Cortes', icon: '💰' },
  ],
  RP: [
    { to: '/rp', label: 'Eventos', icon: '🎫' },
    { to: '/rp/history', label: 'Historial', icon: '📋' },
  ],
  SCANNER: [
    { to: '/scanner', label: 'Escanear', icon: '📷' },
  ],
}

const secondaryNav: Record<UserRole, Array<{ to: string; label: string; icon: string }>> = {
  MANAGER: [
    { to: '/manager/settings', label: 'Config', icon: '⚙️' },
  ],
  RP: [],
  SCANNER: [],
}

export function AppShell() {
  const { session, logout } = useAuth()
  const role: UserRole = session?.role ?? 'MANAGER'
  const navItems = navByRole[role]
  const secondaryItems = secondaryNav[role]

  return (
    <div className="app-shell-unified">
      {/* Header */}
      <header className="app-header">
        <h1 className="app-brand">MonoPass</h1>
        <div className="app-user">
          <span className="text-muted">{session?.userId ?? 'Usuario'}</span>
          <button className="button--ghost" onClick={logout} style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}>
            Salir
          </button>
        </div>
      </header>

      {/* Navegación (sticky en desktop, fixed bottom en móvil) */}
      <nav className="app-bottom-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/manager' || item.to === '/rp' || item.to === '/scanner'}
            className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="bottom-nav-icon">{item.icon}</span>
            <span className="bottom-nav-label">{item.label}</span>
          </NavLink>
        ))}
        {secondaryItems.length > 0 && secondaryItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `bottom-nav-item bottom-nav-item--secondary ${isActive ? 'active' : ''}`}
          >
            <span className="bottom-nav-icon">{item.icon}</span>
            <span className="bottom-nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Contenido principal */}
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
