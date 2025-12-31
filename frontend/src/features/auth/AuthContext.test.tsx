import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { AuthProvider, useAuth } from './AuthContext'
import { coreHttpClient } from '@/lib/httpClient'
import { tokenStore } from '@/lib/tokenStore'

vi.mock('@/lib/httpClient', () => ({
  coreHttpClient: {
    post: vi.fn(),
  },
}))

vi.mock('@/lib/tokenStore', () => {
  const set = vi.fn()
  const clear = vi.fn()
  return {
    tokenStore: {
      set,
      clear,
      getAccessToken: vi.fn(() => null),
    },
  }
})

const mockedHttp = coreHttpClient as unknown as { post: ReturnType<typeof vi.fn> }
const mockedTokenStore = tokenStore as unknown as { set: ReturnType<typeof vi.fn>; clear: ReturnType<typeof vi.fn> }

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  test('login persiste la sesion y notifica al tokenStore', async () => {
    const session = { token: 'jwt-token', userId: 'manager-1', role: 'MANAGER' }
    mockedHttp.post.mockResolvedValue(session)

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })

    await act(async () => {
      await result.current.login({ username: 'manager', password: 'secret' })
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(localStorage.getItem('monopass_session')).toContain('"token":"jwt-token"')
    expect(mockedTokenStore.set).toHaveBeenCalledWith({ accessToken: 'jwt-token' })
  })

  test('logout limpia la sesion y delega en tokenStore.clear', async () => {
    const session = { token: 'jwt-token', userId: 'manager-1', role: 'MANAGER' }
    mockedHttp.post.mockResolvedValue(session)

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    await act(async () => {
      await result.current.login({ username: 'manager', password: 'secret' })
    })

    const clearsBeforeLogout = mockedTokenStore.clear.mock.calls.length

    await act(async () => {
      result.current.logout()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(localStorage.getItem('monopass_session')).toBeNull()
    expect(mockedTokenStore.clear.mock.calls.length).toBe(clearsBeforeLogout + 1)
  })
})
