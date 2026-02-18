import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('12h'),
  CORS_ALLOWED_ORIGINS: z.string().default('*'),
  ENABLE_HEALTH_SEED: z
    .string()
    .optional()
    .transform((value) => value?.toLowerCase() === 'true'),
  PRICING_EVENT: z.coerce.number().int().positive().default(750),
  PRICING_BASE: z.coerce.number().int().positive().default(2999),
  PRICING_PRO: z.coerce.number().int().positive().default(5000),
  PRICING_CURRENCY: z.string().min(3).max(3).default('MXN'),
  MP_ACCESS_TOKEN: z.string().optional(),
  MP_WEBHOOK_SECRET: z.string().optional(),
  APP_PUBLIC_BASE_URL: z.string().url().optional(),
  APP_LOGIN_URL: z.string().url().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
  LANDING_PUBLIC_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  LANDING_PUBLIC_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(60),
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
