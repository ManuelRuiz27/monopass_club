

declare global {
  interface ImportMetaEnv {
    readonly VITE_CORE_API_BASE_URL: string
    readonly VITE_SCANNER_API_BASE_URL: string
    readonly VITE_PUBLIC_CORE_API_BASE_URL?: string
  }
}

export { }
