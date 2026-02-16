import { appEnv } from './env'
import { tokenStore } from './tokenStore'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

type RequestOptions = {
  data?: Record<string, unknown>
  query?: Record<string, string | number | undefined>
  headers?: Record<string, string>
  signal?: AbortSignal
  timeoutMs?: number
}

export class HttpClient {
  private readonly baseUrl: string
  private static readonly DEFAULT_TIMEOUT_MS = 15_000

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private buildUrl(path: string, query?: RequestOptions['query']) {
    const url = new URL(path, this.baseUrl)

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.set(key, String(value))
        }
      })
    }

    return url
  }

  private buildHeaders(options: RequestOptions, hasBody: boolean) {
    const accessToken = tokenStore.getAccessToken()
    return {
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    }
  }

  private async throwIfError(response: Response) {
    if (response.ok) {
      return
    }

    const errorText = await response.text()
    let message = `Error ${response.status}`
    try {
      const parsed = errorText ? JSON.parse(errorText) : null
      if (parsed && typeof parsed.message === 'string') {
        message = parsed.message
      } else if (errorText) {
        message = errorText
      }
    } catch {
      if (errorText) {
        message = errorText
      }
    }

    throw new Error(message || 'Ocurrio un error inesperado')
  }

  async request<T>(method: HttpMethod, path: string, options: RequestOptions = {}): Promise<T> {
    const url = this.buildUrl(path, options.query)
    const hasBody = Boolean(options.data)
    const controller = new AbortController()
    const timeoutMs = options.timeoutMs ?? HttpClient.DEFAULT_TIMEOUT_MS
    const timerId = window.setTimeout(() => {
      controller.abort(new Error(`Request timeout after ${timeoutMs}ms`))
    }, timeoutMs)

    if (options.signal) {
      if (options.signal.aborted) {
        controller.abort(options.signal.reason)
      } else {
        options.signal.addEventListener('abort', () => controller.abort(options.signal?.reason), { once: true })
      }
    }

    let response: Response
    try {
      response = await fetch(url, {
        method,
        headers: this.buildHeaders(options, hasBody),
        body: hasBody ? JSON.stringify(options.data) : undefined,
        signal: controller.signal,
      })
    } catch (error) {
      if (controller.signal.aborted) {
        throw new Error('La solicitud tardo demasiado. Intenta de nuevo.')
      }
      throw error
    } finally {
      window.clearTimeout(timerId)
    }

    await this.throwIfError(response)

    if (response.status === 204) {
      return undefined as T
    }

    return (await response.json()) as T
  }

  async getBlob(path: string, options: Omit<RequestOptions, 'data'> = {}) {
    const url = this.buildUrl(path, options.query)
    const controller = new AbortController()
    const timeoutMs = options.timeoutMs ?? HttpClient.DEFAULT_TIMEOUT_MS
    const timerId = window.setTimeout(() => {
      controller.abort(new Error(`Request timeout after ${timeoutMs}ms`))
    }, timeoutMs)

    if (options.signal) {
      if (options.signal.aborted) {
        controller.abort(options.signal.reason)
      } else {
        options.signal.addEventListener('abort', () => controller.abort(options.signal?.reason), { once: true })
      }
    }

    let response: Response
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: this.buildHeaders(options, false),
        signal: controller.signal,
      })
    } catch (error) {
      if (controller.signal.aborted) {
        throw new Error('La solicitud tardo demasiado. Intenta de nuevo.')
      }
      throw error
    } finally {
      window.clearTimeout(timerId)
    }

    await this.throwIfError(response)
    return response.blob()
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
