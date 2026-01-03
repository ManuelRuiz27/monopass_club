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
      throw app.httpErrors.forbidden('Solo managers pueden acceder a este recurso')
    }
  })

  app.decorate('authorizeRp', async function (request) {
    if (request.user?.role !== UserRole.RP) {
      throw app.httpErrors.forbidden('Solo RPs pueden acceder a este recurso')
    }
  })

  app.decorate('authorizeScanner', async function (request) {
    if (request.user?.role !== UserRole.SCANNER) {
      throw app.httpErrors.forbidden('Solo scanners pueden acceder a este recurso')
    }
  })
}

export default fp(authPlugin)
