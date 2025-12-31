import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { verifyPassword } from '../../lib/password'
import { UserRole } from '@prisma/client'
import { randomUUID } from 'crypto'

const loginBodySchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
})

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post('/auth/login', async (request, reply) => {
    const body = loginBodySchema.parse(request.body)

    const user = await prisma.user.findUnique({
      where: { username: body.username },
    })

    if (!user || !user.active) {
      throw app.httpErrors.unauthorized('Usuario o contraseña inválidos')
    }

    const isValid = await verifyPassword(body.password, user.password)

    if (!isValid) {
      throw app.httpErrors.unauthorized('Usuario o contraseña inválidos')
    }

    if (user.role === UserRole.MANAGER) {
      await prisma.managerSetting.upsert({
        where: { managerId: user.id },
        update: {},
        create: {
          id: randomUUID(),
          managerId: user.id,
          otherLabel: 'Otro',
        },
      })
    }

    const token = app.jwt.sign({ userId: user.id, role: user.role })

    reply.send({ token, userId: user.id, role: user.role })
  })
}