import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import './styles/ui-tokens.css'
import './styles/ui-components.css'
import './index.css'
import { AuthProvider } from '@/features/auth/AuthContext'
import { ToastProvider } from '@/components/ToastProvider'
import { installMockBackend } from '@/lib/mockBackend'

const queryClient = new QueryClient()

restoreSpaRouteFromFallback()
installMockBackend()

console.log('Effective Environment:', {
  core: import.meta.env.VITE_CORE_API_BASE_URL,
  scanner: import.meta.env.VITE_SCANNER_API_BASE_URL,
})

function restoreSpaRouteFromFallback() {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)
  const redirectTarget = url.searchParams.get('redirect')
  if (!redirectTarget) return

  const normalizedTarget = redirectTarget.startsWith('/') ? redirectTarget : `/${redirectTarget}`
  window.history.replaceState(null, '', normalizedTarget)
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
    </QueryClientProvider>
  </React.StrictMode>,
)
