import type { ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { PagePlaceholder } from '@/components/PagePlaceholder'
import { AssignedEventsPage } from '@/features/rp/pages/AssignedEventsPage'
import { GenerateAccessPage } from '@/features/rp/pages/GenerateAccessPage'
import { HistoryPage } from '@/features/rp/pages/HistoryPage'

type Section = {
  label: string
  path?: string
  element?: ReactNode
  title?: string
  description?: string
}

const sections: Section[] = [
  {
    label: 'Eventos asignados',
    element: <AssignedEventsPage />,
  },
  {
    label: 'Generar acceso',
    path: 'generate',
    element: <GenerateAccessPage />,
  },
  {
    label: 'Historial',
    path: 'history',
    element: <HistoryPage />,
  },
]

export const rpRoutes: RouteObject[] = sections.map((section) => {
  const element =
    section.element ?? (
      <PagePlaceholder
        title={section.title ?? section.label}
        description={section.description ?? 'Modulo en construccion'}
        hint={<small>Modulo en construccion</small>}
      />
    )

  return section.path ? { path: section.path, element } : { index: true, element }
})

export function RpShell() {
  return (
    <div>
      <header className="shell-header">
        <div>
          <h2>RP workspace</h2>
          <p className="text-muted">Flujo completo de generacion de accesos segun Sprint 2.</p>
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
