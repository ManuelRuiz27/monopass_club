import { Outlet, NavLink } from 'react-router-dom'

export function TeamLayout() {
    const tabs = [
        { to: '/manager/team/rps', label: 'RPs', icon: '⚡' },
        { to: '/manager/team/groups', label: 'Grupos', icon: '👥' },
        { to: '/manager/team/staff', label: 'Staff Seg.', icon: '🛡️' },
        { to: '/manager/team/clubs', label: 'Clubs', icon: '🏢' },
    ]

    return (
        <div>
            <h3 style={{ marginTop: 0 }}>Gestión de Equipo</h3>
            {/* Sub-navegación tipo Tabs */}
            <nav className="section-nav">
                {tabs.map((tab) => (
                    <NavLink
                        key={tab.to}
                        to={tab.to}
                        className={({ isActive }) => (isActive ? 'active' : undefined)}
                    >
                        {tab.icon} {tab.label}
                    </NavLink>
                ))}
            </nav>
            <Outlet />
        </div>
    )
}
