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

const updateEventSchema = z
  .object({
    name: z.string().min(1).optional(),
    startsAt: z.string().datetime().optional(),
    endsAt: z.string().datetime().optional(),
    active: z.boolean().optional(),
  })
  .refine(
    (value) => value.name !== undefined || value.startsAt !== undefined || value.endsAt !== undefined || value.active !== undefined,
    { message: 'Debes enviar al menos un campo para actualizar' },
  )

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

const templateImageUrlSchema = z
  .string()
  .refine((value) => value.startsWith('data:') || value.startsWith('http://') || value.startsWith('https://'), {
    message: 'templateImageUrl debe ser un data URL o URL http(s) valida',
  })

const templateBodySchema = z.object({
  templateImageUrl: templateImageUrlSchema.nullable().optional(),
  qrPositionX: z.number().min(0).max(1).nullable().optional(),
  qrPositionY: z.number().min(0).max(1).nullable().optional(),
  qrSize: z.number().positive().nullable().optional(),
})

const templateBodyLimitBytes = 10 * 1024 * 1024

const eventParamsSchema = z.object({ eventId: z.string().uuid() })

const assignRpSchema = z.object({
  rpId: z.string().uuid(),
  limitAccesses: z.number().int().positive().nullable().optional(),
})

const assignmentParamsSchema = z.object({
  eventId: z.string().uuid(),
  rpId: z.string().uuid(),
})

const updateAssignmentSchema = z.object({
  limitAccesses: z.number().int().positive().nullable(),
})

type AssignmentWithStats = Prisma.EventRpGetPayload<{
  include: {
    rp: { include: { user: true } }
    _count: { select: { tickets: true } }
  }
}>

type EventWithRelations = Prisma.EventGetPayload<{
  include: {
    club: { select: { id: true, name: true, active: true, managerId: true } }
    assignments: {
      include: {
        rp: { include: { user: true } }
        _count: { select: { tickets: true } }
      }
    }
  }
}>

export async function registerEventRoutes(app: FastifyInstance) {
  app.get('/events', { preHandler: [app.authenticate, app.authorizeManager] }, async (request) => {
    const managerId = request.user!.userId

    const events = await prisma.event.findMany({
      where: { club: { managerId } },
      orderBy: { startsAt: 'asc' },
      include: {
        club: { select: { id: true, name: true, active: true, managerId: true } },
        assignments: {
          include: {
            rp: { include: { user: true } },
            _count: { select: { tickets: true } },
          },
        },
      },
    })

    return events.map(serializeEvent)
  })

  app.post('/events', { preHandler: [app.authenticate, app.authorizeManager] }, async (request, reply) => {
    const managerId = request.user!.userId
    const body = createEventSchema.parse(request.body)

    const club = await ensureClubForManager(app, managerId, body.clubId)
    if (!club.active) {
      throw app.httpErrors.conflict('El club esta desactivado, no puedes crear eventos')
    }

    const startsAt = parseIsoDate(app, body.startsAt, 'inicio')
    const endsAt = parseIsoDate(app, body.endsAt, 'fin')
    ensureStartBeforeEnd(app, startsAt, endsAt)

    const event = await prisma.event.create({
      data: {
        id: randomUUID(),
        clubId: body.clubId,
        name: body.name,
        startsAt,
        endsAt,
      },
      include: {
        club: { select: { id: true, name: true, active: true, managerId: true } },
        assignments: {
          include: {
            rp: { include: { user: true } },
            _count: { select: { tickets: true } },
          },
        },
      },
    })

    reply.code(201)
    return serializeEvent(event)
  })

  app.patch('/events/:eventId', { preHandler: [app.authenticate, app.authorizeManager] }, async (request) => {
    const managerId = request.user!.userId
    const params = eventParamsSchema.parse(request.params)
    const body = updateEventSchema.parse(request.body ?? {})

    const existing = await ensureEventForManager(app, managerId, params.eventId)
    const nextStartsAt = body.startsAt ? parseIsoDate(app, body.startsAt, 'inicio') : existing.startsAt
    const nextEndsAt = body.endsAt ? parseIsoDate(app, body.endsAt, 'fin') : existing.endsAt
    ensureStartBeforeEnd(app, nextStartsAt, nextEndsAt)

    await prisma.event.update({
      where: { id: existing.id },
      data: {
        name: body.name ?? existing.name,
        startsAt: nextStartsAt,
        endsAt: nextEndsAt,
        active: body.active ?? existing.active,
      },
    })

    const updated = await loadEventWithAssignments(app, managerId, existing.id)
    return serializeEvent(updated)
  })

  app.post('/events/recurring', { preHandler: [app.authenticate, app.authorizeManager] }, async (request, reply) => {
    const managerId = request.user!.userId
    const body = recurringEventSchema.parse(request.body)

    const club = await ensureClubForManager(app, managerId, body.clubId)
    if (!club.active) {
      throw app.httpErrors.conflict('El club esta desactivado, no puedes crear eventos')
    }

    const occurrences = body.occurrences.map((occurrence) => {
      const startsAt = parseIsoDate(app, occurrence.startsAt, 'inicio')
      const endsAt = parseIsoDate(app, occurrence.endsAt, 'fin')
      ensureStartBeforeEnd(app, startsAt, endsAt)
      return {
        startsAt,
        endsAt,
      }
    })

    const created = await prisma.$transaction(
      occurrences.map((occurrence) =>
        prisma.event.create({
          data: {
            id: randomUUID(),
            clubId: body.clubId,
            name: body.name,
            startsAt: occurrence.startsAt,
            endsAt: occurrence.endsAt,
          },
        }),
      ),
    )

    const createdIds = created.map((event) => event.id)

    const createdEvents = await prisma.event.findMany({
      where: { id: { in: createdIds } },
      orderBy: { startsAt: 'asc' },
      include: {
        club: { select: { id: true, name: true, active: true, managerId: true } },
        assignments: {
          include: {
            rp: { include: { user: true } },
            _count: { select: { tickets: true } },
          },
        },
      },
    })

    reply.code(201)
    return createdEvents.map(serializeEvent)
  })

  app.get(
    '/events/:eventId/template',
    { preHandler: [app.authenticate, app.authorizeManager] },
    async (request) => {
      const managerId = request.user!.userId
      const params = templateParamsSchema.parse(request.params)

      const event = await ensureEventForManager(app, managerId, params.eventId)

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
    { preHandler: [app.authenticate, app.authorizeManager], bodyLimit: templateBodyLimitBytes },
    async (request) => {
      const managerId = request.user!.userId
      const params = templateParamsSchema.parse(request.params)
      const body = templateBodySchema.parse(request.body ?? {})

      await ensureEventForManager(app, managerId, params.eventId)

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

      await ensureEventForManager(app, managerId, params.eventId)

      const assignments = await prisma.eventRp.findMany({
        where: { eventId: params.eventId },
        include: {
          rp: { include: { user: true } },
          _count: { select: { tickets: true } },
        },
        orderBy: { createdAt: 'asc' },
      })

      return assignments.map(serializeAssignment)
    },
  )

  app.post(
    '/events/:eventId/rps',
    { preHandler: [app.authenticate, app.authorizeManager] },
    async (request) => {
      const managerId = request.user!.userId
      const params = eventParamsSchema.parse(request.params)
      const body = assignRpSchema.parse(request.body)

      const event = await ensureEventForManager(app, managerId, params.eventId)
      if (!event.active) {
        throw app.httpErrors.conflict('El evento esta cerrado')
      }

      const rp = await prisma.rpProfile.findUnique({
        where: { id: body.rpId },
        include: { user: true },
      })

      if (!rp) {
        throw app.httpErrors.notFound('RP no encontrado')
      }

      if (rp.managerId !== managerId) {
        throw app.httpErrors.forbidden('No puedes asignar un RP de otro manager')
      }

      if (!rp.active || !rp.user.active) {
        throw app.httpErrors.conflict('El RP esta inactivo')
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
            _count: { select: { tickets: true } },
          },
        })
        return serializeAssignment(assignment)
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          throw app.httpErrors.conflict('El RP ya esta asignado a este evento')
        }
        throw error
      }
    },
  )

  app.patch(
    '/events/:eventId/rps/:rpId',
    { preHandler: [app.authenticate, app.authorizeManager] },
    async (request) => {
      const managerId = request.user!.userId
      const params = assignmentParamsSchema.parse(request.params)
      const body = updateAssignmentSchema.parse(request.body)

      await ensureEventForManager(app, managerId, params.eventId)

      const assignment = await prisma.eventRp.findFirst({
        where: { eventId: params.eventId, rpId: params.rpId },
        include: {
          rp: { include: { user: true } },
          _count: { select: { tickets: true } },
        },
      })

      if (!assignment) {
        throw app.httpErrors.notFound('Asignacion no encontrada')
      }

      if (body.limitAccesses !== null && assignment._count.tickets > body.limitAccesses) {
        throw app.httpErrors.conflict('El limite no puede ser menor a los accesos generados')
      }

      const updated = await prisma.eventRp.update({
        where: { id: assignment.id },
        data: { limitAccesses: body.limitAccesses },
        include: {
          rp: { include: { user: true } },
          _count: { select: { tickets: true } },
        },
      })

      return serializeAssignment(updated)
    },
  )

  app.delete(
    '/events/:eventId/rps/:rpId',
    { preHandler: [app.authenticate, app.authorizeManager] },
    async (request, reply) => {
      const managerId = request.user!.userId
      const params = assignmentParamsSchema.parse(request.params)

      await ensureEventForManager(app, managerId, params.eventId)

      const assignment = await prisma.eventRp.findFirst({
        where: { eventId: params.eventId, rpId: params.rpId },
      })

      if (!assignment) {
        throw app.httpErrors.notFound('Asignacion no encontrada')
      }

      await prisma.eventRp.delete({ where: { id: assignment.id } })
      reply.code(204).send()
    },
  )
}

function parseIsoDate(app: FastifyInstance, value: string, field: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw app.httpErrors.badRequest(`Fecha invalida para ${field}`)
  }
  return date
}

function ensureStartBeforeEnd(app: FastifyInstance, startsAt: Date, endsAt: Date) {
  if (endsAt <= startsAt) {
    throw app.httpErrors.badRequest('La fecha de fin debe ser posterior al inicio')
  }
}

async function ensureClubForManager(app: FastifyInstance, managerId: string, clubId: string) {
  const club = await prisma.club.findUnique({ where: { id: clubId } })
  if (!club) {
    throw app.httpErrors.notFound('Club no encontrado')
  }
  if (club.managerId !== managerId) {
    throw app.httpErrors.forbidden('No puedes acceder a este club')
  }
  return club
}

async function ensureEventForManager(app: FastifyInstance, managerId: string, eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { club: { select: { id: true, name: true, active: true, managerId: true } } },
  })

  if (!event) {
    throw app.httpErrors.notFound('Evento no encontrado')
  }

  if (event.club.managerId !== managerId) {
    throw app.httpErrors.forbidden('No puedes acceder a este evento')
  }

  return event
}

async function loadEventWithAssignments(app: FastifyInstance, managerId: string, eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      club: { select: { id: true, name: true, active: true, managerId: true } },
      assignments: {
        include: {
          rp: { include: { user: true } },
          _count: { select: { tickets: true } },
        },
      },
    },
  })

  if (!event) {
    throw app.httpErrors.notFound('Evento no encontrado')
  }

  if (event.club.managerId !== managerId) {
    throw app.httpErrors.forbidden('No puedes acceder a este evento')
  }

  return event
}

function serializeEvent(event: EventWithRelations) {
  const { managerId, ...club } = event.club
  void managerId
  return {
    id: event.id,
    club,
    name: event.name,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    active: event.active,
    templateImageUrl: event.templateImageUrl,
    qrPositionX: event.qrPositionX,
    qrPositionY: event.qrPositionY,
    qrSize: event.qrSize,
    assignments: event.assignments.map(serializeAssignment),
  }
}

function serializeAssignment(assignment: AssignmentWithStats) {
  return {
    id: assignment.id,
    eventId: assignment.eventId,
    rpId: assignment.rpId,
    limitAccesses: assignment.limitAccesses,
    usedAccesses: assignment._count.tickets,
    rp: {
      id: assignment.rp.id,
      active: assignment.rp.active,
      user: {
        id: assignment.rp.user.id,
        name: assignment.rp.user.name,
        username: assignment.rp.user.username,
      },
    },
  }
}
