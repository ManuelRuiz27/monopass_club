import { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma'
import { z } from 'zod'
import { randomUUID } from 'crypto'

const createClubSchema = z.object({
  name: z.string().min(1),
  capacity: z.number().int().positive(),
})

const updateClubSchema = z.object({
  name: z.string().min(1).optional(),
  capacity: z.number().int().positive().optional(),
  active: z.boolean().optional(),
})

const clubParamsSchema = z.object({
  clubId: z.string().uuid(),
})

export async function registerClubRoutes(app: FastifyInstance) {
  app.get('/clubs', { preHandler: [app.authenticate, app.authorizeManager] }, async (request) => {
    const managerId = request.user!.userId
    return prisma.club.findMany({
      where: { managerId },
      orderBy: { createdAt: 'desc' },
    })
  })

  app.post('/clubs', { preHandler: [app.authenticate, app.authorizeManager] }, async (request) => {
    const managerId = request.user!.userId
    const body = createClubSchema.parse(request.body)

    const club = await prisma.club.create({
      data: {
        id: randomUUID(),
        managerId,
        ...body,
      },
    })

    return club
  })

  app.patch<{ Params: { clubId: string } }>(
    '/clubs/:clubId',
    { preHandler: [app.authenticate, app.authorizeManager] },
    async (request) => {
      const managerId = request.user!.userId
      const params = clubParamsSchema.parse(request.params)
      const body = updateClubSchema.parse(request.body ?? {})

      const existing = await prisma.club.findFirst({
        where: { id: params.clubId, managerId },
      })

      if (!existing) {
        throw app.httpErrors.notFound('Club no encontrado')
      }

      return prisma.club.update({
        where: { id: params.clubId },
        data: body,
      })
    },
  )
}