import Fastify from 'fastify'
import cors from '@fastify/cors'
import sensible from '@fastify/sensible'
import jwt from '@fastify/jwt'
import { env } from './config/env'
import { registerRoutes } from './http/routes'
import authPlugin from './plugins/auth'

function buildCorsOriginMatcher() {
  const value = env.CORS_ALLOWED_ORIGINS.trim()
  if (value === '*' || value.length === 0) {
    return (_origin: string | undefined, callback: (error: Error | null, allow: boolean) => void) =>
      callback(null, true)
  }

  const allowList = new Set(
    value
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0),
  )

  return (origin: string | undefined, callback: (error: Error | null, allow: boolean) => void) => {
    if (!origin) {
      callback(null, true)
      return
    }
    callback(null, allowList.has(origin))
  }
}

export async function buildServer() {
  const app = Fastify({
    logger: true,
  })

  await app.register(cors, {
    origin: buildCorsOriginMatcher(),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
  await app.register(sensible)
  await app.register(jwt, { secret: env.JWT_SECRET })
  await app.register(authPlugin)
  await registerRoutes(app)

  return app
}

if (require.main === module) {
  buildServer()
    .then((app) => app.listen({ port: env.PORT, host: '0.0.0.0' }))
    .then(() => {
      console.log(`Core API listening on port ${env.PORT}`)
    })
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}
