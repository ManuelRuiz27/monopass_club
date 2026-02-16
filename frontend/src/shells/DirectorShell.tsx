import { lazy, Suspense, type ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'

const DirectorDashboardPage = lazy(async () => ({
  default: (await import('@/features/director/pages/DirectorDashboardPage')).DirectorDashboardPage,
}))
const DirectorComparativePage = lazy(async () => ({
  default: (await import('@/features/director/pages/DirectorComparativePage')).DirectorComparativePage,
}))
const DirectorHistoricalPage = lazy(async () => ({
  default: (await import('@/features/director/pages/DirectorHistoricalPage')).DirectorHistoricalPage,
}))
const DirectorReportsPage = lazy(async () => ({
  default: (await import('@/features/director/pages/DirectorReportsPage')).DirectorReportsPage,
}))
const DirectorStatusPage = lazy(async () => ({
  default: (await import('@/features/director/pages/DirectorStatusPage')).DirectorStatusPage,
}))

function lazyElement(node: ReactNode) {
  return <Suspense fallback={<p className="text-muted">Cargando...</p>}>{node}</Suspense>
}

export const directorRoutes: RouteObject[] = [
  { index: true, element: lazyElement(<DirectorDashboardPage />) },
  { path: 'comparative', element: lazyElement(<DirectorComparativePage />) },
  { path: 'historical', element: lazyElement(<DirectorHistoricalPage />) },
  { path: 'reports', element: lazyElement(<DirectorReportsPage />) },
  { path: 'status', element: lazyElement(<DirectorStatusPage />) },
]

export function DirectorShell() {
  return <Outlet />
}
