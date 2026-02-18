import { lazy, Suspense, useRef, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { useGsapInteractiveScale } from '@/lib/motion/useGsapInteractiveScale'
import { useGsapRouteTransition } from '@/lib/motion/useGsapRouteTransition'

const ScannerPage = lazy(async () => ({ default: (await import('@/features/scanner/pages/ScannerPage')).ScannerPage }))
const ScannerCutsPage = lazy(async () => ({ default: (await import('@/features/scanner/pages/ScannerCutsPage')).ScannerCutsPage }))

function lazyElement(node: ReactNode) {
  return <Suspense fallback={<p className="text-muted">Cargando...</p>}>{node}</Suspense>
}

const sections: Array<{ label: string; to: string; icon: string; end?: boolean }> = [
  { label: 'Escanear', to: '.', icon: 'qr_code_scanner', end: true },
  { label: 'Cortes', to: 'cuts', icon: 'analytics' },
]

export const scannerRoutes: RouteObject[] = [
  { index: true, element: lazyElement(<ScannerPage />) },
  { path: 'cuts', element: lazyElement(<ScannerCutsPage />) },
]

export function ScannerShell() {
  const location = useLocation()
  const outletRef = useRef<HTMLDivElement | null>(null)
  const navRef = useRef<HTMLElement | null>(null)

  useGsapRouteTransition(outletRef, location.key || location.pathname, { y: 20, duration: 0.24 })
  useGsapInteractiveScale(navRef, 'a', location.pathname, { hoverScale: 1.02, pressScale: 0.97 })

  return (
    <div>
      <header className="shell-header">
        <div>
          <h2>Scanner</h2>
          <p className="text-muted">Validacion y confirmacion de accesos en puerta.</p>
        </div>
      </header>
      <nav ref={navRef} className="section-nav">
        {sections.map((section) => (
          <NavLink
            key={section.label}
            to={section.to}
            end={section.end}
            className={({ isActive }) => (isActive ? 'active' : undefined)}
          >
            <span className="material-symbols-outlined section-nav__icon" aria-hidden="true">
              {section.icon}
            </span>
            <span>{section.label}</span>
          </NavLink>
        ))}
      </nav>
      <div ref={outletRef} className="motion-route-shell">
        <div data-gsap-route-panel>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
