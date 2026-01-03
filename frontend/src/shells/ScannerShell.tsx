import type { ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { PagePlaceholder } from '@/components/PagePlaceholder'
import { ScannerPage } from '@/features/scanner/pages/ScannerPage'

type Section = {
  label: string
  path?: string
  element?: ReactNode
  title: string
  description: string
}

const sections: Section[] = [
  {
    label: 'Scanner',
    title: 'Scanner operativo',
    description: 'Validacion y confirmacion del QR en puerta.',
    element: <ScannerPage />,
  },
  {
    label: 'Cortes',
    path: 'cuts',
    title: 'Cortes tiempo real',
    description: 'Resumen por evento/RP y filtros por rango de fecha.',
  },
]

export const scannerRoutes: RouteObject[] = sections.map((section) => {
  const element =
    section.element ?? (
      <PagePlaceholder
        title={section.title}
        description={section.description}
        hint={<small>Modulo en construccion</small>}
      />
    )

  return section.path ? { path: section.path, element } : { index: true, element }
})

export function ScannerShell() {
  return (
    <div>
      <header className="shell-header">
        <div>
          <h2>Scanner</h2>
          <p className="text-muted">Microservicio y SPA dedicada a validate/confirm.</p>
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
