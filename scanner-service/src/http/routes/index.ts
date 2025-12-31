import { FastifyInstance } from 'fastify'
import { registerHealthRoute } from './health'
import { registerScanRoutes } from './scan'

export async function registerRoutes(app: FastifyInstance) {
  await registerHealthRoute(app)
  await registerScanRoutes(app)
}