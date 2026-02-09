import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('12h'),
  ENABLE_HEALTH_SEED: z
    .string()
    .optional()
    .transform((value) => value?.toLowerCase() === 'true'),
  PORT: z.coerce.number().default(4000),
})

const fallbackTestEnv: Partial<Record<'DATABASE_URL' | 'JWT_SECRET', string>> =
  process.env.NODE_ENV === 'test'
    ? {
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/monopass?schema=public',
        JWT_SECRET: 'test-secret-key-change-me',
      }
    : {}

const parsed = envSchema.safeParse({
  ...fallbackTestEnv,
  ...process.env,
})

if (!parsed.success) {
  console.error('Invalid environment variables', parsed.error.format())
  process.exit(1)
}

export const env = parsed.data
