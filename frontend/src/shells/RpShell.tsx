import { lazy, Suspense, type ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { PagePlaceholder } from '@/components/PagePlaceholder'

const GenerateAccessPage = lazy(async () => ({ default: (await import('@/features/rp/pages/GenerateAccessPage')).GenerateAccessPage }))
const HistoryPage = lazy(async () => ({ default: (await import('@/features/rp/pages/HistoryPage')).HistoryPage }))
const ProfilePage = lazy(async () => ({ default: (await import('@/features/rp/pages/ProfilePage')).ProfilePage }))

function lazyElement(node: ReactNode) {
  return <Suspense fallback={<p>Cargando...</p>}>{node}</Suspense>
}

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
    element: lazyElement(<GenerateAccessPage />),
  },
  {
    label: 'Historial',
    path: 'history',
    element: lazyElement(<HistoryPage />),
  },
  {
    label: 'Perfil',
    path: 'profile',
    element: lazyElement(<ProfilePage />),
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
  return <Outlet />
}
