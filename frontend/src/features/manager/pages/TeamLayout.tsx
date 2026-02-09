import { Outlet, NavLink } from 'react-router-dom'

export function TeamLayout() {
  const tabs = [
    { to: '/manager/team/rps', label: 'RPs', icon: 'groups' },
    { to: '/manager/team/groups', label: 'Grupos', icon: 'group_work' },
    { to: '/manager/team/staff', label: 'Scanner staff', icon: 'qr_code_scanner' },
    { to: '/manager/team/clubs', label: 'Clubs', icon: 'domain' },
  ]

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Gestion de equipo</h3>
      <nav className="section-nav">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => (isActive ? 'active' : undefined)}
          >
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '1rem' }}>
              {tab.icon}
            </span>
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  )
}
