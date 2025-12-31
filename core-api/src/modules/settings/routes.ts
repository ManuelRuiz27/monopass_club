import { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma'
import { z } from 'zod'
import { randomUUID } from 'crypto'

const updateLabelSchema = z.object({
  otherLabel: z.string().min(1),
})

export async function registerSettingsRoutes(app: FastifyInstance) {
  app.get('/settings/guest-types/other-label', { preHandler: [app.authenticate, app.authorizeManager] }, async (request) => {
    const managerId = request.user!.userId

    const setting = await prisma.managerSetting.upsert({
      where: { managerId },
      update: {},
      create: {
        id: randomUUID(),
        managerId,
        otherLabel: 'Otro',
      },
    })

    return { otherLabel: setting.otherLabel }
  })

  app.patch('/settings/guest-types/other-label', { preHandler: [app.authenticate, app.authorizeManager] }, async (request) => {
    const managerId = request.user!.userId
    const body = updateLabelSchema.parse(request.body)

    const updated = await prisma.managerSetting.upsert({
      where: { managerId },
      update: { otherLabel: body.otherLabel },
      create: {
        id: randomUUID(),
        managerId,
        otherLabel: body.otherLabel,
      },
    })

    return { otherLabel: updated.otherLabel }
  })
}