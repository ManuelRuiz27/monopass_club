import { lazy, Suspense, type ReactNode } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'

const DashboardPage = lazy(async () => ({ default: (await import('@/features/manager/pages/DashboardPage')).DashboardPage }))
const ClubsPage = lazy(async () => ({ default: (await import('@/features/manager/pages/ClubsPage')).ClubsPage }))
const EventsPage = lazy(async () => ({ default: (await import('@/features/manager/pages/EventsPage')).EventsPage }))
const RpsPage = lazy(async () => ({ default: (await import('@/features/manager/pages/RpsPage')).RpsPage }))
const RpGroupsPage = lazy(async () => ({ default: (await import('@/features/manager/pages/RpGroupsPage')).RpGroupsPage }))
const ScannerStaffPage = lazy(async () => ({ default: (await import('@/features/manager/pages/ScannerStaffPage')).ScannerStaffPage }))
const SettingsPage = lazy(async () => ({ default: (await import('@/features/manager/pages/SettingsPage')).SettingsPage }))
const CutsPage = lazy(async () => ({ default: (await import('@/features/manager/pages/CutsPage')).CutsPage }))
const TemplatePage = lazy(async () => ({ default: (await import('@/features/manager/pages/TemplatePage')).TemplatePage }))
const TeamLayout = lazy(async () => ({ default: (await import('@/features/manager/pages/TeamLayout')).TeamLayout }))

function lazyElement(node: ReactNode) {
  return <Suspense fallback={<p>Cargando...</p>}>{node}</Suspense>
}

export const managerRoutes: RouteObject[] = [
  { index: true, element: lazyElement(<DashboardPage />) },
  { path: 'events', element: lazyElement(<EventsPage />) },
  { path: 'cuts', element: lazyElement(<CutsPage />) },
  { path: 'template', element: lazyElement(<TemplatePage />) },
  { path: 'settings', element: lazyElement(<SettingsPage />) },
  { path: 'clubs', element: lazyElement(<ClubsPage />) },
  { path: 'rps', element: lazyElement(<RpsPage />) },
  { path: 'groups', element: lazyElement(<RpGroupsPage />) },
  { path: 'staff', element: lazyElement(<ScannerStaffPage />) },
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
