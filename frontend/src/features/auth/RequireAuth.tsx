import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    console.log('DEBUG: RequireAuth - Not authenticated, redirecting to login')
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  console.log('DEBUG: RequireAuth - Authenticated, rendering children')

  return <>{children}</>
}