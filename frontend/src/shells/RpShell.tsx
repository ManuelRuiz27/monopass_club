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
  const route: RouteObject = {
    element: section.element ?? (
      <PagePlaceholder
        title={section.title}
        description={section.description}
        hint={<small>Modulo en construccion</small>}
      />
    ),
  }

  if (section.path) {
    route.path = section.path
  } else {
    route.index = true
  }

  return route
})

export function RpShell() {
  return (
    <div>
      <header style={{ marginBottom: '1rem' }}>
        <h2 style={{ margin: 0 }}>RP workspace</h2>
        <p style={{ margin: '0.25rem 0', color: '#475569' }}>
          Flujo completo de generacion de accesos segun Sprint 2.
        </p>
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
