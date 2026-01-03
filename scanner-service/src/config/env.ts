import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  CORE_API_BASE_URL: z.string().url(),
  SCANNER_API_KEY: z.string().min(12),
  JWT_SECRET: z.string().min(12).optional(),
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(4100),
})

const fallbackTestEnv: Partial<z.infer<typeof envSchema>> =
  process.env.NODE_ENV === 'test'
    ? {
        CORE_API_BASE_URL: 'http://localhost:4000',
        SCANNER_API_KEY: 'test-api-key-123',
        DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/monopass?schema=public',
      }
    : {}

const parsed = envSchema.safeParse({
  ...fallbackTestEnv,
  ...process.env,
})

if (!parsed.success) {
  console.error('Invalid environment variables', parsed.error.flatten())
  process.exit(1)
}

export const env = parsed.data
