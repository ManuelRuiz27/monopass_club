import { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { hashPassword } from '../../lib/password'
import { Prisma, UserRole } from '@prisma/client'

const createRpSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(3),
  password: z.string().min(6),
})

const updateRpSchema = z.object({
  name: z.string().min(1).optional(),
  active: z.boolean().optional(),
})

const rpParamsSchema = z.object({ rpId: z.string().uuid() })

export async function registerRpRoutes(app: FastifyInstance) {
  app.get('/rps', { preHandler: [app.authenticate, app.authorizeManager] }, async (request) => {
    const managerId = request.user!.userId
    return prisma.rpProfile.findMany({
      where: { managerId },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    })
  })

  app.post('/rps', { preHandler: [app.authenticate, app.authorizeManager] }, async (request) => {
    const managerId = request.user!.userId
    const body = createRpSchema.parse(request.body)

    try {
      const user = await prisma.user.create({
        data: {
          id: randomUUID(),
          name: body.name,
          username: body.username,
          password: await hashPassword(body.password),
          role: UserRole.RP,
        },
      })

      const profile = await prisma.rpProfile.create({
        data: {
          id: randomUUID(),
          managerId,
          userId: user.id,
        },
        include: { user: true },
      })

      return profile
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw app.httpErrors.conflict('El username ya existe')
      }
      throw error
    }
  })

  app.patch(
    '/rps/:rpId',
    { preHandler: [app.authenticate, app.authorizeManager] },
    async (request) => {
      const managerId = request.user!.userId
      const params = rpParamsSchema.parse(request.params)
      const body = updateRpSchema.parse(request.body ?? {})

      const rp = await prisma.rpProfile.findFirst({ where: { id: params.rpId, managerId }, include: { user: true } })
      if (!rp) {
        throw app.httpErrors.notFound('RP no encontrado')
      }

      await prisma.rpProfile.update({
        where: { id: params.rpId },
        data: { active: body.active ?? rp.active },
      })

      if (body.name) {
        await prisma.user.update({ where: { id: rp.userId }, data: { name: body.name } })
      }

      return prisma.rpProfile.findUnique({ where: { id: params.rpId }, include: { user: true } })
    },
  )
}