import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'

const navItems = [
  { to: '/manager', label: 'Manager' },
  { to: '/rp', label: 'RP' },
  { to: '/scanner', label: 'Scanner' },
]

export function AppShell() {
  const { session, logout } = useAuth()

  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar">
        <h1>MonoPass Club</h1>
        <p style={{ marginTop: 0, color: '#475569', fontSize: '0.9rem' }}>
          MVP workspace. Combina Manager, RP y Scanner en un solo repo.
        </p>
        <nav className="app-shell__nav">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'active' : undefined)}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        {session ? (
          <div style={{ marginTop: '2rem', fontSize: '0.85rem', color: '#475569' }}>
            <p style={{ marginBottom: '0.5rem' }}>Sesión: {session.userId}</p>
            <button style={{ width: '100%' }} onClick={logout}>
              Cerrar sesión
            </button>
          </div>
        ) : null}
      </aside>
      <main className="app-shell__content">
        <Outlet />
      </main>
    </div>
  )
}