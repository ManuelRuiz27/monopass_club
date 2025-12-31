import { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { hashPassword } from '../../lib/password'
import { Prisma, UserRole } from '@prisma/client'

const createScannerSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(3),
  password: z.string().min(6),
})

const updateScannerSchema = z.object({
  name: z.string().min(1).optional(),
  active: z.boolean().optional(),
})

const scannerParamsSchema = z.object({ scannerId: z.string().uuid() })

export async function registerScannerRoutes(app: FastifyInstance) {
  app.get('/scanners', { preHandler: [app.authenticate, app.authorizeManager] }, async (request) => {
    const managerId = request.user!.userId
    return prisma.scannerProfile.findMany({
      where: { managerId },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    })
  })

  app.post('/scanners', { preHandler: [app.authenticate, app.authorizeManager] }, async (request) => {
    const managerId = request.user!.userId
    const body = createScannerSchema.parse(request.body)

    try {
      const user = await prisma.user.create({
        data: {
          id: randomUUID(),
          name: body.name,
          username: body.username,
          password: await hashPassword(body.password),
          role: UserRole.SCANNER,
        },
      })

      const profile = await prisma.scannerProfile.create({
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
    '/scanners/:scannerId',
    { preHandler: [app.authenticate, app.authorizeManager] },
    async (request) => {
      const managerId = request.user!.userId
      const params = scannerParamsSchema.parse(request.params)
      const body = updateScannerSchema.parse(request.body ?? {})

      const scanner = await prisma.scannerProfile.findFirst({
        where: { id: params.scannerId, managerId },
        include: { user: true },
      })
      if (!scanner) {
        throw app.httpErrors.notFound('Scanner no encontrado')
      }

      await prisma.scannerProfile.update({
        where: { id: params.scannerId },
        data: { active: body.active ?? scanner.active },
      })

      if (body.name) {
        await prisma.user.update({ where: { id: scanner.userId }, data: { name: body.name } })
      }

      return prisma.scannerProfile.findUnique({ where: { id: params.scannerId }, include: { user: true } })
    },
  )
}