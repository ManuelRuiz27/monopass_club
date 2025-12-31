import { appEnv } from './env'
import { tokenStore } from './tokenStore'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

type RequestOptions = {
  data?: Record<string, unknown>
  query?: Record<string, string | number | undefined>
  headers?: Record<string, string>
  signal?: AbortSignal
}

export class HttpClient {
  constructor(private readonly baseUrl: string) {}

  async request<T>(method: HttpMethod, path: string, options: RequestOptions = {}): Promise<T> {
    const url = new URL(path, this.baseUrl)

    if (options.query) {
      Object.entries(options.query).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.set(key, String(value))
        }
      })
    }

    const accessToken = tokenStore.getAccessToken()
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...options.headers,
      },
      body: options.data ? JSON.stringify(options.data) : undefined,
      signal: options.signal,
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`Request failed (${response.status}): ${errorBody}`)
    }

    if (response.status === 204) {
      return undefined as T
    }

    return (await response.json()) as T
  }

  get<T>(path: string, options?: RequestOptions) {
    return this.request<T>('GET', path, options)
  }

  post<T>(path: string, data?: RequestOptions['data']) {
    return this.request<T>('POST', path, { data })
  }

  put<T>(path: string, data?: RequestOptions['data']) {
    return this.request<T>('PUT', path, { data })
  }

  patch<T>(path: string, data?: RequestOptions['data']) {
    return this.request<T>('PATCH', path, { data })
  }

  delete<T>(path: string) {
    return this.request<T>('DELETE', path)
  }
}

export const coreHttpClient = new HttpClient(appEnv.coreApiBaseUrl)
export const scannerHttpClient = new HttpClient(appEnv.scannerApiBaseUrl)