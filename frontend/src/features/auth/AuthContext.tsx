import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { coreHttpClient } from '@/lib/httpClient'
import { tokenStore } from '@/lib/tokenStore'

export type UserRole = 'MANAGER' | 'RP' | 'SCANNER'

type Session = {
  token: string
  userId: string
  role: UserRole
}

const SESSION_KEY = 'monopass_session'

type AuthContextValue = {
  session: Session | null
  isAuthenticated: boolean
  login: (credentials: { username: string; password: string }) => Promise<Session>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function loadSession(): Session | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => loadSession())

  useEffect(() => {
    if (session?.token) {
      tokenStore.set({ accessToken: session.token })
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    } else {
      tokenStore.clear()
      window.localStorage.removeItem(SESSION_KEY)
    }
  }, [session])

  const login = async (credentials: { username: string; password: string }) => {
    const response = await coreHttpClient.post<Session>('/auth/login', credentials)
    setSession(response)
    return response
  }

  const logout = () => {
    setSession(null)
  }

  const value = useMemo<AuthContextValue>(
    () => ({ session, isAuthenticated: Boolean(session?.token), login, logout }),
    [session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
