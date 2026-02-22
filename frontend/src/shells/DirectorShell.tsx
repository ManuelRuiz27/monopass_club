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
const DirectorManagersPage = lazy(async () => ({
  default: (await import('@/features/director/pages/DirectorManagersPage')).DirectorManagersPage,
}))
const DirectorRevenueDashboardPage = lazy(async () => ({
  default: (await import('@/features/director/pages/DirectorRevenueDashboardPage')).DirectorRevenueDashboardPage,
}))
const DirectorPlansPage = lazy(async () => ({
  default: (await import('@/features/director/pages/DirectorPlansPage')).DirectorPlansPage,
}))
const DirectorSubscriptionsPage = lazy(async () => ({
  default: (await import('@/features/director/pages/DirectorSubscriptionsPage')).DirectorSubscriptionsPage,
}))
const DirectorBillingPage = lazy(async () => ({
  default: (await import('@/features/director/pages/DirectorBillingPage')).DirectorBillingPage,
}))
const DirectorFinancePage = lazy(async () => ({
  default: (await import('@/features/director/pages/DirectorFinancePage')).DirectorFinancePage,
}))

function lazyElement(node: ReactNode) {
  return <Suspense fallback={<p className="text-muted">Cargando...</p>}>{node}</Suspense>
}

export const directorRoutes: RouteObject[] = [
  { index: true, element: lazyElement(<DirectorDashboardPage />) },
  { path: 'comparative', element: lazyElement(<DirectorComparativePage />) },
  { path: 'historical', element: lazyElement(<DirectorHistoricalPage />) },
  { path: 'reports', element: lazyElement(<DirectorReportsPage />) },
  { path: 'managers', element: lazyElement(<DirectorManagersPage />) },
  { path: 'status', element: lazyElement(<DirectorStatusPage />) },
  { path: 'revenue', element: lazyElement(<DirectorRevenueDashboardPage />) },
  { path: 'plans', element: lazyElement(<DirectorPlansPage />) },
  { path: 'subscriptions', element: lazyElement(<DirectorSubscriptionsPage />) },
  { path: 'billing', element: lazyElement(<DirectorBillingPage />) },
  { path: 'finance', element: lazyElement(<DirectorFinancePage />) },
]

export function DirectorShell() {
  return <Outlet />
}
