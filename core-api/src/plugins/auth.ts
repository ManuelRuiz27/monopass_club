import fp from 'fastify-plugin'
import { FastifyPluginAsync } from 'fastify'
import { UserRole } from '@prisma/client'

const authPlugin: FastifyPluginAsync = async (app) => {
  app.decorate('authenticate', async function (request) {
    try {
      await request.jwtVerify()
    } catch {
      throw app.httpErrors.unauthorized('Invalid or missing token')
    }
  })

  app.decorate('authorizeManager', async function (request) {
    if (request.user?.role !== UserRole.MANAGER) {
      throw app.httpErrors.forbidden('Only managers can access this resource')
    }
  })

  app.decorate('authorizeRp', async function (request) {
    if (request.user?.role !== UserRole.RP) {
      throw app.httpErrors.forbidden('Only RPs can access this resource')
    }
  })
}

export default fp(authPlugin)
