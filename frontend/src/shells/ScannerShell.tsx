import { lazy, Suspense, type ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'

const ScannerPage = lazy(async () => ({ default: (await import('@/features/scanner/pages/ScannerPage')).ScannerPage }))
const ScannerCutsPage = lazy(async () => ({ default: (await import('@/features/scanner/pages/ScannerCutsPage')).ScannerCutsPage }))

function lazyElement(node: ReactNode) {
  return <Suspense fallback={<p>Cargando...</p>}>{node}</Suspense>
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
  return (
    <div>
      <header className="shell-header">
        <div>
          <h2>Scanner</h2>
          <p className="text-muted">Validacion y confirmacion de accesos en puerta.</p>
        </div>
      </header>
      <nav className="section-nav">
        {sections.map((section) => (
          <NavLink
            key={section.label}
            to={section.to}
            end={section.end}
            className={({ isActive }) => (isActive ? 'active' : undefined)}
          >
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '1rem' }}>
              {section.icon}
            </span>
            <span>{section.label}</span>
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  )
}
