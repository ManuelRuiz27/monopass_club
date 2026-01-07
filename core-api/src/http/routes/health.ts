import { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma'

export async function registerHealthRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({ status: 'ok', service: 'core-api' }))

  app.get('/health/diagnose', async () => {
    const [users, clubs, events, tickets] = await Promise.all([
      prisma.user.count(),
      prisma.club.count(),
      prisma.event.count(),
      prisma.ticket.count(),
    ])

    return {
      status: 'ok',
      counts: {
        users,
        clubs,
        events,
        tickets,
      },
      timestamp: new Date().toISOString(),
    }
  })
}