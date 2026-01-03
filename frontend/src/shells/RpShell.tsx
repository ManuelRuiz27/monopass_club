import type { ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { PagePlaceholder } from '@/components/PagePlaceholder'
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
    label: 'Generar acceso',
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

// Shell simplificado - navegación ahora está en AppShell
export function RpShell() {
  return <Outlet />
}
