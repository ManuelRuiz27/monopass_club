import { Navigate, createBrowserRouter } from 'react-router-dom'
import { AppShell } from './shells/AppShell'
import { DirectorShell, directorRoutes } from './shells/DirectorShell'
import { ManagerShell, managerRoutes } from './shells/ManagerShell'
import { RpShell, rpRoutes } from './shells/RpShell'
import { ScannerShell, scannerRoutes } from './shells/ScannerShell'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { LoginPage } from '@/features/auth/LoginPage'
import { NotFoundPage } from '@/features/auth/NotFoundPage'
import { StaffTokenLoginPage } from '@/features/auth/StaffTokenLoginPage'
import { RoleGate } from '@/features/auth/RoleGate'

export const router = createBrowserRouter([
  {
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/manager" replace /> },
      {
        path: '/manager',
        element: (
          <RoleGate allow={['MANAGER']}>
            <ManagerShell />
          </RoleGate>
        ),
        children: managerRoutes,
      },
      {
        path: '/rp',
        element: (
          <RoleGate allow={['RP']}>
            <RpShell />
          </RoleGate>
        ),
        children: rpRoutes,
      },
      {
        path: '/scanner',
        element: (
          <RoleGate allow={['SCANNER']}>
            <ScannerShell />
          </RoleGate>
        ),
        children: scannerRoutes,
      },
      {
        path: '/director',
        element: (
          <RoleGate allow={['DIRECTOR']}>
            <DirectorShell />
          </RoleGate>
        ),
        children: directorRoutes,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/staff/login-token',
    element: <StaffTokenLoginPage />,
  },
])
