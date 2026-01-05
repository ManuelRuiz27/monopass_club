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

  app.get(
    '/clubs/:clubId',
    { preHandler: [app.authenticate, app.authorizeManager] },
    async (request) => {
      const managerId = request.user!.userId
      const params = clubParamsSchema.parse(request.params)

      const club = await ensureClubAccess(app, managerId, params.clubId)

      return club
    },
  )

  app.post('/clubs', { preHandler: [app.authenticate, app.authorizeManager] }, async (request, reply) => {
    const managerId = request.user!.userId
    const body = createClubSchema.parse(request.body)

    const club = await prisma.club.create({
      data: {
        id: randomUUID(),
        managerId,
        ...body,
      },
    })

    reply.code(201)
    return club
  })

  app.patch(
    '/clubs/:clubId',
    { preHandler: [app.authenticate, app.authorizeManager] },
    async (request) => {
      const managerId = request.user!.userId
      const params = clubParamsSchema.parse(request.params)
      const body = updateClubSchema.parse(request.body ?? {})

      await ensureClubAccess(app, managerId, params.clubId)
      const data = {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.capacity !== undefined ? { capacity: body.capacity } : {}),
        ...(body.active !== undefined ? { active: body.active } : {}),
      }
      return prisma.club.update({
        where: { id: params.clubId },
        data,
      })
    },
  )

  app.delete(
    '/clubs/:clubId',
    { preHandler: [app.authenticate, app.authorizeManager] },
    async (request, reply) => {
      const managerId = request.user!.userId
      const params = clubParamsSchema.parse(request.params)

      await ensureClubAccess(app, managerId, params.clubId)

      await prisma.club.delete({ where: { id: params.clubId } })
      reply.code(204).send()
    },
  )
}

async function ensureClubAccess(app: FastifyInstance, managerId: string, clubId: string) {
  const club = await prisma.club.findUnique({ where: { id: clubId } })
  if (!club) {
    throw app.httpErrors.notFound('Club no encontrado')
  }
  if (club.managerId !== managerId) {
    throw app.httpErrors.forbidden('No puedes acceder a este club')
  }
  return club
}
