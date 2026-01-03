import { z } from 'zod'

const envSchema = z.object({
  VITE_CORE_API_BASE_URL: z.string().min(1),
  VITE_SCANNER_API_BASE_URL: z.string().min(1),
  VITE_PUBLIC_CORE_API_BASE_URL: z.string().min(1).optional(),
})

const fallback =
  import.meta.env?.MODE === 'test'
    ? {
        VITE_CORE_API_BASE_URL: 'http://localhost:4000',
        VITE_SCANNER_API_BASE_URL: 'http://localhost:4100',
      }
    : {}

const parsed = envSchema.safeParse({
  ...fallback,
  ...import.meta.env,
})

if (!parsed.success) {
  console.error('Invalid Vite environment variables', parsed.error.flatten())
  throw new Error('Env validation failed')
}

export const appEnv = {
  coreApiBaseUrl: parsed.data.VITE_CORE_API_BASE_URL,
  scannerApiBaseUrl: parsed.data.VITE_SCANNER_API_BASE_URL,
  publicCoreApiBaseUrl: parsed.data.VITE_PUBLIC_CORE_API_BASE_URL ?? parsed.data.VITE_CORE_API_BASE_URL,
}
