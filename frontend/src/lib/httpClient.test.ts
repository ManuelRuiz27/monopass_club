import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HttpClient } from './httpClient'
import { tokenStore } from './tokenStore'

const BASE_URL = 'https://example.com'

describe('HttpClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    tokenStore.set({ accessToken: 'token-123' })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    tokenStore.clear()
  })

  it('serializes query params and attaches auth header', async () => {
    const client = new HttpClient(BASE_URL)
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({ message: 'ok' }),
    }

    ;(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse)

    const result = await client.get<{ message: string }>('/health', {
      query: { foo: 'bar', page: 2 },
    })

    expect(result.message).toBe('ok')
    expect(fetch).toHaveBeenCalledWith(new URL('/health?foo=bar&page=2', BASE_URL), {
      method: 'GET',
      headers: {
        Authorization: 'Bearer token-123',
      },
      body: undefined,
      signal: expect.any(AbortSignal),
    })
  })

  it('throws HttpError with status and parsed payload on non-2xx responses', async () => {
    const client = new HttpClient(BASE_URL)
    const mockResponse = {
      ok: false,
      status: 409,
      text: async () => JSON.stringify({ reason: 'ALREADY_SCANNED', ticket: { status: 'SCANNED' } }),
    }

    ;(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse)

    await expect(client.post('/scan/confirm', { qrToken: 'abc', clientRequestId: 'req-1' })).rejects.toMatchObject({
      name: 'HttpError',
      status: 409,
      payload: { reason: 'ALREADY_SCANNED', ticket: { status: 'SCANNED' } },
    })
  })
})
