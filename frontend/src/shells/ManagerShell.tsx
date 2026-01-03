import { Outlet, Navigate } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { DashboardPage } from '@/features/manager/pages/DashboardPage'
import { ClubsPage } from '@/features/manager/pages/ClubsPage'
import { EventsPage } from '@/features/manager/pages/EventsPage'
import { RpsPage } from '@/features/manager/pages/RpsPage'
import { RpGroupsPage } from '@/features/manager/pages/RpGroupsPage'
import { ScannerStaffPage } from '@/features/manager/pages/ScannerStaffPage'
import { SettingsPage } from '@/features/manager/pages/SettingsPage'
import { CutsPage } from '@/features/manager/pages/CutsPage'

import { TeamLayout } from '@/features/manager/pages/TeamLayout'

export const managerRoutes: RouteObject[] = [
  { index: true, element: <DashboardPage /> },
  { path: 'events', element: <EventsPage /> },
  { path: 'cuts', element: <CutsPage /> },
  { path: 'settings', element: <SettingsPage /> },
  // Agrupación de Equipo bajo ruta /team
  {
    path: 'team',
    element: <TeamLayout />,
    children: [
      { index: true, element: <Navigate to="rps" replace /> },
      { path: 'clubs', element: <ClubsPage /> },
      { path: 'rps', element: <RpsPage /> },
      { path: 'groups', element: <RpGroupsPage /> },
      { path: 'staff', element: <ScannerStaffPage /> },
    ],
  },
]

// Shell simplificado - navegación ahora está en AppShell
export function ManagerShell() {
  return <Outlet />
}
