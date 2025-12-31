import fp from 'fastify-plugin'
import { FastifyPluginAsync } from 'fastify'

const authPlugin: FastifyPluginAsync = async (app) => {
  app.decorate('authenticate', async function (request) {
    try {
      await request.jwtVerify()
    } catch {
      throw app.httpErrors.unauthorized('Invalid or missing token')
    }
  })
}

export default fp(authPlugin)
