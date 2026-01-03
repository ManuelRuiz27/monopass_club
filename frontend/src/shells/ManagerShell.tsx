import { type ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { DashboardPage } from '@/features/manager/pages/DashboardPage'
import { ClubsPage } from '@/features/manager/pages/ClubsPage'
import { EventsPage } from '@/features/manager/pages/EventsPage'
import { TemplatePage } from '@/features/manager/pages/TemplatePage'
import { RpsPage } from '@/features/manager/pages/RpsPage'
import { ScannerStaffPage } from '@/features/manager/pages/ScannerStaffPage'
import { SettingsPage } from '@/features/manager/pages/SettingsPage'
import { CutsPage } from '@/features/manager/pages/CutsPage'
import { PagePlaceholder } from '@/components/PagePlaceholder'

type Section = {
  label: string
  path?: string
  element: ReactNode
  description?: string
}

const sections: Section[] = [
  {
    label: 'Dashboard',
    element: <DashboardPage />,
  },
  {
    label: 'Clubs',
    path: 'clubs',
    element: <ClubsPage />,
  },
  {
    label: 'Eventos',
    path: 'events',
    element: <EventsPage />,
  },
  {
    label: 'Plantilla QR',
    path: 'template',
    element: <TemplatePage />,
  },
  {
    label: 'RPs',
    path: 'rps',
    element: <RpsPage />,
  },
  {
    label: 'Staff Scanner',
    path: 'scanner-staff',
    element: <ScannerStaffPage />,
  },
  {
    label: 'Cortes',
    path: 'cuts',
    element: <CutsPage />,
  },
  {
    label: 'Settings',
    path: 'settings',
    element: <SettingsPage />,
  },
]

export const managerRoutes: RouteObject[] = sections.map((section) => {
  const element =
    section.element ?? (
      <PagePlaceholder title={section.label} description={section.description ?? 'Modulo en construccion'} />
    )

  return section.path ? { path: section.path, element } : { index: true, element }
})

export function ManagerShell() {
  return (
    <div>
      <header className="shell-header">
        <div>
          <h2>Manager</h2>
          <p className="text-muted">Gestiona clubs, eventos y staff.</p>
        </div>
      </header>
      <nav className="section-nav">
        {sections.map((section) => (
          <NavLink
            key={section.label}
            to={section.path ? section.path : '.'}
            end={!section.path}
            className={({ isActive }) => (isActive ? 'active' : undefined)}
          >
            {section.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  )
}
