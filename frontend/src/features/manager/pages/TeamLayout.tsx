import { Outlet, NavLink } from 'react-router-dom'

export function TeamLayout() {
  const tabs = [
    { to: '/manager/team/rps', label: 'RPs', icon: 'groups' },
    { to: '/manager/team/groups', label: 'Grupos', icon: 'group_work' },
    { to: '/manager/team/staff', label: 'Scanner staff', icon: 'qr_code_scanner' },
    { to: '/manager/team/clubs', label: 'Clubs', icon: 'domain' },
  ]

  return (
    <div className="manager-team-layout">
      <header className="manager-team-layout__header">
        <h3 className="manager-team-layout__title">Gestion de equipo</h3>
      </header>

      <nav className="section-nav manager-team-layout__nav">
        {tabs.map((tab) => (
          <NavLink key={tab.to} to={tab.to} className={({ isActive }) => (isActive ? 'active' : undefined)}>
            <span className="material-symbols-outlined manager-team-layout__icon" aria-hidden="true">
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
