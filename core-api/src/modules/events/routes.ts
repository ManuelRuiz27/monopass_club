import { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { Prisma } from '@prisma/client'

const createEventSchema = z.object({
  clubId: z.string().uuid(),
  name: z.string().min(1),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
})

const recurringEventSchema = z.object({
  clubId: z.string().uuid(),
  name: z.string().min(1),
  occurrences: z
    .array(
      z.object({
        startsAt: z.string().datetime(),
        endsAt: z.string().datetime(),
      }),
    )
    .min(1),
})

const templateParamsSchema = z.object({ eventId: z.string().uuid() })

const templateBodySchema = z.object({
  templateImageUrl: z.string().url().nullable().optional(),
  qrPositionX: z.number().min(0).max(1).nullable().optional(),
  qrPositionY: z.number().min(0).max(1).nullable().optional(),
  qrSize: z.number().positive().nullable().optional(),
})

const eventParamsSchema = z.object({ eventId: z.string().uuid() })

const assignRpSchema = z.object({
  rpId: z.string().uuid(),
  limitAccesses: z.number().int().positive().nullable().optional(),
})

export async function registerEventRoutes(app: FastifyInstance) {
  app.get('/events', { preHandler: [app.authenticate, app.authorizeManager] }, async (request) => {
    const managerId = request.user!.userId
    return prisma.event.findMany({
      where: { club: { managerId } },
      orderBy: { startsAt: 'asc' },
      include: {
        club: { select: { id: true, name: true } },
      },
    })
  })

  app.post('/events', { preHandler: [app.authenticate, app.authorizeManager] }, async (request) => {
    const managerId = request.user!.userId
    const body = createEventSchema.parse(request.body)

    const club = await prisma.club.findFirst({ where: { id: body.clubId, managerId } })
    if (!club) {
      throw app.httpErrors.notFound('Club no encontrado')
    }

    const event = await prisma.event.create({
      data: {
        id: randomUUID(),
        clubId: body.clubId,
        name: body.name,
        startsAt: new Date(body.startsAt),
        endsAt: new Date(body.endsAt),
      },
    })

    return event
  })

  app.post('/events/recurring', { preHandler: [app.authenticate, app.authorizeManager] }, async (request) => {
    const managerId = request.user!.userId
    const body = recurringEventSchema.parse(request.body)

    const club = await prisma.club.findFirst({ where: { id: body.clubId, managerId } })
    if (!club) {
      throw app.httpErrors.notFound('Club no encontrado')
    }

    const events = await prisma.$transaction(
      body.occurrences.map((occurrence) =>
        prisma.event.create({
          data: {
            id: randomUUID(),
            clubId: body.clubId,
            name: body.name,
            startsAt: new Date(occurrence.startsAt),
            endsAt: new Date(occurrence.endsAt),
          },
        }),
      ),
    )

    return events
  })

  app.get(
    '/events/:eventId/template',
    { preHandler: [app.authenticate, app.authorizeManager] },
    async (request) => {
      const managerId = request.user!.userId
      const params = templateParamsSchema.parse(request.params)

      const event = await prisma.event.findFirst({
        where: { id: params.eventId, club: { managerId } },
      })

      if (!event) {
        throw app.httpErrors.notFound('Evento no encontrado')
      }

      return {
        templateImageUrl: event.templateImageUrl,
        qrPositionX: event.qrPositionX,
        qrPositionY: event.qrPositionY,
        qrSize: event.qrSize,
      }
    },
  )

  app.put(
    '/events/:eventId/template',
    { preHandler: [app.authenticate, app.authorizeManager] },
    async (request) => {
      const managerId = request.user!.userId
      const params = templateParamsSchema.parse(request.params)
      const body = templateBodySchema.parse(request.body ?? {})

      const event = await prisma.event.findFirst({ where: { id: params.eventId, club: { managerId } } })
      if (!event) {
        throw app.httpErrors.notFound('Evento no encontrado')
      }

      return prisma.event.update({
        where: { id: params.eventId },
        data: body,
      })
    },
  )

  app.get(
    '/events/:eventId/rps',
    { preHandler: [app.authenticate, app.authorizeManager] },
    async (request) => {
      const managerId = request.user!.userId
      const params = eventParamsSchema.parse(request.params)

      const event = await prisma.event.findFirst({ where: { id: params.eventId, club: { managerId } } })
      if (!event) {
        throw app.httpErrors.notFound('Evento no encontrado')
      }

      return prisma.eventRp.findMany({
        where: { eventId: params.eventId },
        include: {
          rp: { include: { user: true } },
        },
      })
    },
  )

  app.post(
    '/events/:eventId/rps',
    { preHandler: [app.authenticate, app.authorizeManager] },
    async (request) => {
      const managerId = request.user!.userId
      const params = eventParamsSchema.parse(request.params)
      const body = assignRpSchema.parse(request.body)

      const [event, rp] = await Promise.all([
        prisma.event.findFirst({ where: { id: params.eventId, club: { managerId } } }),
        prisma.rpProfile.findFirst({ where: { id: body.rpId, managerId }, include: { user: true } }),
      ])

      if (!event) {
        throw app.httpErrors.notFound('Evento no encontrado')
      }

      if (!rp) {
        throw app.httpErrors.notFound('RP no encontrado')
      }

      try {
        const assignment = await prisma.eventRp.create({
          data: {
            id: randomUUID(),
            eventId: params.eventId,
            rpId: body.rpId,
            limitAccesses: body.limitAccesses ?? null,
          },
          include: {
            rp: { include: { user: true } },
          },
        })
        return assignment
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          throw app.httpErrors.conflict('El RP ya esta asignado a este evento')
        }
        throw error
      }
    },
  )
}