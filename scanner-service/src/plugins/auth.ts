import fp from 'fastify-plugin'
import { FastifyPluginAsync } from 'fastify'
import { UserRole } from '@prisma/client'
import { prisma } from '../lib/prisma'

const authPlugin: FastifyPluginAsync = async (app) => {
  app.decorate('authenticate', async function (request) {
    try {
      await request.jwtVerify()
    } catch {
      throw app.httpErrors.unauthorized('Invalid or missing token')
    }

    const user = await prisma.user.findUnique({
      where: { id: request.user.userId },
      select: { id: true, role: true, active: true },
    })

    if (!user || !user.active || user.role !== request.user.role) {
      throw app.httpErrors.unauthorized('Invalid or expired session')
    }
  })

  app.decorate('authorizeScanner', async function (request) {
    if (request.user?.role !== UserRole.SCANNER) {
      throw app.httpErrors.forbidden('Solo scanners pueden acceder a este recurso')
    }
  })
}

export default fp(authPlugin)
