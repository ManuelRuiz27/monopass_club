import { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma'
import { seedDatabase } from '../../lib/seeder'
import { env } from '../../config/env'

export async function registerHealthRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({ status: 'ok', service: 'core-api' }))

  app.get('/health/diagnose', { preHandler: [app.authenticate, app.authorizeManager] }, async () => {
    const [users, clubs, events, tickets] = await Promise.all([prisma.user.count(), prisma.club.count(), prisma.event.count(), prisma.ticket.count()])

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

  app.post('/health/seed', { preHandler: [app.authenticate, app.authorizeManager] }, async () => {
    if (!env.ENABLE_HEALTH_SEED) {
      throw app.httpErrors.forbidden('Seeding deshabilitado en este entorno')
    }
    await seedDatabase(prisma)
    return { status: 'seeded', message: 'Database seeded successfully' }
  })
}
