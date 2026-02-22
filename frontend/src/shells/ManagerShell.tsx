import { lazy, Suspense, type ReactNode } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'

const DashboardPage = lazy(async () => ({ default: (await import('@/features/manager/pages/DashboardPage')).DashboardPage }))
const LivePage = lazy(async () => ({ default: (await import('@/features/manager/pages/LivePage')).LivePage }))
const ClubsPage = lazy(async () => ({ default: (await import('@/features/manager/pages/ClubsPage')).ClubsPage }))
const EventsPage = lazy(async () => ({ default: (await import('@/features/manager/pages/EventsPage')).EventsPage }))
const EventDetailPage = lazy(async () => ({ default: (await import('@/features/manager/pages/EventDetailPage')).EventDetailPage }))
const RpsPage = lazy(async () => ({ default: (await import('@/features/manager/pages/RpsPage')).RpsPage }))
const RpGroupsPage = lazy(async () => ({ default: (await import('@/features/manager/pages/RpGroupsPage')).RpGroupsPage }))
const ScannerStaffPage = lazy(async () => ({ default: (await import('@/features/manager/pages/ScannerStaffPage')).ScannerStaffPage }))
const SettingsPage = lazy(async () => ({ default: (await import('@/features/manager/pages/SettingsPage')).SettingsPage }))
const CutsPage = lazy(async () => ({ default: (await import('@/features/manager/pages/CutsPage')).CutsPage }))
const TeamLayout = lazy(async () => ({ default: (await import('@/features/manager/pages/TeamLayout')).TeamLayout }))

function lazyElement(node: ReactNode) {
  return <Suspense fallback={<p className="text-muted">Cargando...</p>}>{node}</Suspense>
}

export const managerRoutes: RouteObject[] = [
  { index: true, element: lazyElement(<DashboardPage />) },
  { path: 'live', element: lazyElement(<LivePage />) },
  { path: 'events', element: lazyElement(<EventsPage />) },
  { path: 'events/:eventId', element: lazyElement(<EventDetailPage />) },
  { path: 'cuts', element: lazyElement(<CutsPage />) },
  { path: 'settings', element: lazyElement(<SettingsPage />) },
  { path: 'clubs', element: <Navigate to="/manager/team/clubs" replace /> },
  { path: 'rps', element: <Navigate to="/manager/team/rps" replace /> },
  { path: 'groups', element: <Navigate to="/manager/team/groups" replace /> },
  { path: 'staff', element: <Navigate to="/manager/team/staff" replace /> },
  {
    path: 'team',
    element: lazyElement(<TeamLayout />),
    children: [
      { index: true, element: <Navigate to="rps" replace /> },
      { path: 'clubs', element: lazyElement(<ClubsPage />) },
      { path: 'rps', element: lazyElement(<RpsPage />) },
      { path: 'groups', element: lazyElement(<RpGroupsPage />) },
      { path: 'staff', element: lazyElement(<ScannerStaffPage />) },
    ],
  },
]

export function ManagerShell() {
  return <Outlet />
}
