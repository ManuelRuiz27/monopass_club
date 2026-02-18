/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_CORE_API_BASE_URL: string
    readonly VITE_LANDING_MOCK_BACKEND?: 'true' | 'false'
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
