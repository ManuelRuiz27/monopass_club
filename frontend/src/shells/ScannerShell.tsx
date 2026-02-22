import { lazy, Suspense, useRef, type ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { useGsapRouteTransition } from '@/lib/motion/useGsapRouteTransition'

const ScannerPage = lazy(async () => ({ default: (await import('@/features/scanner/pages/ScannerPage')).ScannerPage }))

function lazyElement(node: ReactNode) {
  return <Suspense fallback={<p className="text-muted">Cargando...</p>}>{node}</Suspense>
}

export const scannerRoutes: RouteObject[] = [
  { index: true, element: lazyElement(<ScannerPage />) },
  { path: 'cuts', element: <Navigate to="/scanner" replace /> },
]

export function ScannerShell() {
  const location = useLocation()
  const outletRef = useRef<HTMLDivElement | null>(null)

  useGsapRouteTransition(outletRef, location.key || location.pathname, { y: 20, duration: 0.24 })

  return (
    <div className="role-shell role-shell--scanner">
      <div ref={outletRef} className="motion-route-shell">
        <div data-gsap-route-panel>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
