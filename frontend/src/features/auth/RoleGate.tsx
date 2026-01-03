import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import type { ReactNode } from 'react'
import type { UserRole } from './AuthContext'

type RoleGateProps = {
  allow: UserRole[]
  children: ReactNode
}

export function RoleGate({ allow, children }: RoleGateProps) {
  const { session } = useAuth()
  const location = useLocation()

  if (!session) {
    return null
  }

  if (!allow.includes(session.role)) {
    const fallback = `/${session.role.toLowerCase()}`
    if (location.pathname === fallback) {
      return null
    }
    return <Navigate to={fallback} replace />
  }

  return <>{children}</>
}
