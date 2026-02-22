import { lazy, Suspense, useRef, type ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { PagePlaceholder } from '@/components/PagePlaceholder'
import { useGsapRouteTransition } from '@/lib/motion/useGsapRouteTransition'

const RpEventsPage = lazy(async () => ({ default: (await import('@/features/rp/pages/RpEventsPage')).RpEventsPage }))
const RpGeneratedPage = lazy(async () => ({ default: (await import('@/features/rp/pages/RpGeneratedPage')).RpGeneratedPage }))
const HistoryPage = lazy(async () => ({ default: (await import('@/features/rp/pages/HistoryPage')).HistoryPage }))
const ProfilePage = lazy(async () => ({ default: (await import('@/features/rp/pages/ProfilePage')).ProfilePage }))

function lazyElement(node: ReactNode) {
  return <Suspense fallback={<p className="text-muted">Cargando...</p>}>{node}</Suspense>
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
    label: 'Mis eventos',
    path: 'events',
    element: lazyElement(<RpEventsPage />),
  },
  {
    label: 'Acceso generado',
    path: 'generated',
    element: lazyElement(<RpGeneratedPage />),
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

rpRoutes.unshift({ index: true, element: <Navigate to="events" replace /> })

export function RpShell() {
  const location = useLocation()
  const shellRef = useRef<HTMLDivElement | null>(null)

  useGsapRouteTransition(shellRef, location.key || location.pathname)

  return (
    <div ref={shellRef} className="motion-route-shell role-shell role-shell--rp">
      <div data-gsap-route-panel>
        <Outlet />
      </div>
    </div>
  )
}
