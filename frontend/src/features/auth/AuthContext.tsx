import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { coreHttpClient } from '@/lib/httpClient'
import { tokenStore } from '@/lib/tokenStore'

export type UserRole = 'MANAGER' | 'RP' | 'SCANNER' | 'DIRECTOR'

type Session = {
  token: string
  userId: string
  role: UserRole
}

const SESSION_KEY = 'monopass_session'
const APP_MOCK_ENABLED = import.meta.env.VITE_APP_MOCK === 'true'
const RP_MOCK_ENABLED = import.meta.env.VITE_RP_MOCK === 'true' && !APP_MOCK_ENABLED

type AuthContextValue = {
  session: Session | null
  isAuthenticated: boolean
  login: (credentials: { username: string; password: string }) => Promise<Session>
  loginWithToken: (payload: { token: string }) => Promise<Session>
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
    console.log('DEBUG: AuthProvider session effect', session)
    if (session?.token) {
      tokenStore.set({ accessToken: session.token })
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    } else {
      tokenStore.clear()
      window.localStorage.removeItem(SESSION_KEY)
    }
  }, [session])

  const login = async (credentials: { username: string; password: string }) => {
    if (RP_MOCK_ENABLED) {
      const mockRole: UserRole = 'RP'
      const response: Session = {
        token: 'mock-rp-token',
        userId: credentials.username || 'rp.mock',
        role: mockRole,
      }
      setSession(response)
      return response
    }

    const response = await coreHttpClient.post<Session>('/auth/login', credentials)
    setSession(response)
    return response
  }

  const loginWithToken = async ({ token }: { token: string }) => {
    if (RP_MOCK_ENABLED) {
      const trimmedToken = token.trim()
      const response: Session = {
        token: 'mock-rp-token',
        userId: trimmedToken || 'rp.mock',
        role: 'RP',
      }
      setSession(response)
      return response
    }

    const trimmed = token.trim()
    if (!trimmed) {
      throw new Error('Token invalido o vacio')
    }

    try {
      const response = await coreHttpClient.post<Session>('/auth/login-token', { token: trimmed })
      setSession(response)
      return response
    } catch {
      // Backward-compatible fallback while backend token endpoint is rolled out.
      const response = await coreHttpClient.post<Session>('/auth/login', {
        username: trimmed,
        password: trimmed,
      })
      setSession(response)
      return response
    }
  }

  const logout = () => {
    setSession(null)
  }

  const value = useMemo<AuthContextValue>(
    () => ({ session, isAuthenticated: Boolean(session?.token), login, loginWithToken, logout }),
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
