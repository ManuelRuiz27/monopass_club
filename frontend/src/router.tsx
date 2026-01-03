import { Navigate, createBrowserRouter } from 'react-router-dom'
import { AppShell } from './shells/AppShell'
import { ManagerShell, managerRoutes } from './shells/ManagerShell'
import { RpShell, rpRoutes } from './shells/RpShell'
import { ScannerShell, scannerRoutes } from './shells/ScannerShell'
import { PagePlaceholder } from './components/PagePlaceholder'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { LoginPage } from '@/features/auth/LoginPage'
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
        path: '*',
        element: (
          <PagePlaceholder
            title="Ups, no encontramos la pagina"
            description="Revisa la URL o vuelve a una de las secciones principales."
          />
        ),
      },
    ],
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
])
