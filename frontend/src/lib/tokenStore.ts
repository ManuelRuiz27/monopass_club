type TokenState = {
  accessToken: string | null
}

type Listener = () => void

const STORAGE_KEY = 'monopass_token'

class TokenStore {
  private state: TokenState = {
    accessToken: typeof window === 'undefined' ? null : window.localStorage.getItem(STORAGE_KEY),
  }

  private listeners = new Set<Listener>()

  set(tokens: TokenState) {
    this.state = tokens
    if (typeof window !== 'undefined') {
      if (tokens.accessToken) {
        window.localStorage.setItem(STORAGE_KEY, tokens.accessToken)
      } else {
        window.localStorage.removeItem(STORAGE_KEY)
      }
    }
    this.notify()
  }

  clear() {
    this.set({ accessToken: null })
  }

  getAccessToken() {
    return this.state.accessToken
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify() {
    this.listeners.forEach((listener) => listener())
  }
}

export const tokenStore = new TokenStore()