import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

async function renderAuthHook() {
  vi.resetModules()
  const mockedHttp = { post: vi.fn() }
  const mockedTokenStore = {
    set: vi.fn(),
    clear: vi.fn(),
    getAccessToken: vi.fn(() => null),
  }

  vi.doMock('@/lib/httpClient', () => ({
    coreHttpClient: mockedHttp,
  }))

  vi.doMock('@/lib/tokenStore', () => ({
    tokenStore: mockedTokenStore,
  }))

  const { AuthProvider, useAuth } = await import('./AuthContext')

  return {
    ...renderHook(() => useAuth(), { wrapper: AuthProvider }),
    mockedHttp,
    mockedTokenStore,
  }
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  test('login persiste la sesion mockeada de RP y notifica al tokenStore', async () => {
    vi.stubEnv('VITE_APP_MOCK', 'false')
    vi.stubEnv('VITE_RP_MOCK', 'true')

    const { result, mockedHttp, mockedTokenStore } = await renderAuthHook()

    await act(async () => {
      await result.current.login({ username: 'manager', password: 'secret' })
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(localStorage.getItem('monopass_session')).toContain('"token":"mock-rp-token"')
    expect(mockedTokenStore.set).toHaveBeenCalledWith({ accessToken: 'mock-rp-token' })
    expect(mockedHttp.post).not.toHaveBeenCalled()
  })

  test('logout limpia la sesion y delega en tokenStore.clear', async () => {
    vi.stubEnv('VITE_APP_MOCK', 'false')
    vi.stubEnv('VITE_RP_MOCK', 'true')

    const { result, mockedTokenStore } = await renderAuthHook()

    await act(async () => {
      await result.current.login({ username: 'manager', password: 'secret' })
    })

    const clearsBeforeLogout = mockedTokenStore.clear.mock.calls.length

    await act(async () => {
      result.current.logout()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(localStorage.getItem('monopass_session')).toBeNull()
    await waitFor(() => {
      expect(mockedTokenStore.clear.mock.calls.length).toBe(clearsBeforeLogout + 1)
    })
  })

  test('loginWithToken hace fallback a /auth/login cuando /auth/login-token no existe', async () => {
    vi.stubEnv('VITE_APP_MOCK', 'false')
    vi.stubEnv('VITE_RP_MOCK', 'false')

    const session = { token: 'jwt-token', userId: 'scanner-1', role: 'SCANNER' }
    const { result, mockedHttp } = await renderAuthHook()
    mockedHttp.post.mockRejectedValueOnce(new Error('not found')).mockResolvedValueOnce(session)

    await act(async () => {
      await result.current.loginWithToken({ token: 'ABC123' })
    })

    expect(mockedHttp.post).toHaveBeenNthCalledWith(1, '/auth/login-token', { token: 'ABC123' })
    expect(mockedHttp.post).toHaveBeenNthCalledWith(2, '/auth/login', { username: 'ABC123', password: 'ABC123' })
    expect(result.current.isAuthenticated).toBe(true)
  })
})
