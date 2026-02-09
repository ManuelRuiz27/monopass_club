import { FastifyInstance } from 'fastify'
import { TicketType } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'

const cutsQuerySchema = z.object({
  eventId: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
})

const cutDetailParamsSchema = z.object({
  eventId: z.string().uuid(),
  rpId: z.string().uuid(),
})

const cutDetailQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
})

type GuestCounters = Record<TicketType, number>

function createEmptyCounters(): GuestCounters {
  return {
    GENERAL: 0,
    VIP: 0,
    OTHER: 0,
  }
}

export async function registerCutsRoutes(app: FastifyInstance) {
  app.get(
    '/cuts',
    { preHandler: [app.authenticate, app.authorizeScanner] },
    async (request) => {
      const scanner = await resolveScannerProfile(app, request.user?.userId)
      const query = cutsQuerySchema.parse(request.query)
      const range = normalizeRange(app, query.from, query.to)
      const limit = query.limit ?? 20
      const offset = query.offset ?? 0

      if (query.eventId) {
        await ensureEventBelongsToScannerManager(app, query.eventId, scanner.managerId)
      }

      const eventWhere = {
        club: { managerId: scanner.managerId },
        ...(query.eventId ? { id: query.eventId } : {}),
      } as const

      const totalEvents = await prisma.event.count({
        where: eventWhere,
      })

      const availableEvents = await prisma.event.findMany({
        where: eventWhere,
        select: {
          id: true,
          name: true,
          startsAt: true,
        },
        orderBy: { startsAt: 'desc' },
      })

      const events = await prisma.event.findMany({
        where: eventWhere,
        include: {
          club: { select: { name: true } },
          assignments: {
            include: {
              rp: { include: { user: true } },
            },
          },
        },
        orderBy: { startsAt: 'desc' },
        take: limit,
        skip: offset,
      })

      if (events.length === 0) {
        return {
          filters: {
            eventId: query.eventId ?? null,
            from: query.from ?? null,
            to: query.to ?? null,
          },
          pagination: {
            totalEvents,
            limit,
            offset,
            hasMore: false,
          },
          availableEvents: availableEvents.map((event) => ({
            eventId: event.id,
            eventName: event.name,
          })),
          total: 0,
          totalGeneral: 0,
          totalVip: 0,
          totalOther: 0,
          events: [],
        }
      }

      const scans = await prisma.ticketScan.findMany({
        where: {
          ...(range.scannedAt ? { scannedAt: range.scannedAt } : {}),
          ticket: {
            eventId: { in: events.map((event) => event.id) },
          },
        },
        include: {
          ticket: {
            select: {
              eventId: true,
              rpId: true,
              guestType: true,
            },
          },
        },
      })

      const aggregated = aggregateScans(scans)

      const eventsResponse = events.map((event) => {
        const aggregates = aggregated.events.get(event.id) ?? { totals: createEmptyCounters(), rps: new Map<string, GuestCounters>() }
        const rpCounters = new Map(aggregates.rps)

        for (const assignment of event.assignments) {
          if (!rpCounters.has(assignment.rpId)) {
            rpCounters.set(assignment.rpId, createEmptyCounters())
          }
        }

        const rps = Array.from(rpCounters.entries())
          .map(([rpId, counters]) => {
            const total = counters.GENERAL + counters.VIP + counters.OTHER
            const assignment = event.assignments.find((item) => item.rpId === rpId)
            return {
              rpId,
              rpName: assignment?.rp.user.name ?? 'RP removido',
              totalGeneral: counters.GENERAL,
              totalVip: counters.VIP,
              totalOther: counters.OTHER,
              total,
            }
          })
          .sort((a, b) => b.total - a.total)

        const totalGeneral = aggregates.totals.GENERAL
        const totalVip = aggregates.totals.VIP
        const totalOther = aggregates.totals.OTHER
        const total = totalGeneral + totalVip + totalOther

        return {
          eventId: event.id,
          eventName: event.name,
          clubName: event.club.name,
          startsAt: event.startsAt.toISOString(),
          endsAt: event.endsAt.toISOString(),
          totalGeneral,
          totalVip,
          totalOther,
          total,
          rps,
        }
      })

      const totalGeneral = aggregated.totals.GENERAL
      const totalVip = aggregated.totals.VIP
      const totalOther = aggregated.totals.OTHER
      const total = totalGeneral + totalVip + totalOther

      return {
        filters: {
          eventId: query.eventId ?? null,
          from: query.from ?? null,
          to: query.to ?? null,
        },
        pagination: {
          totalEvents,
          limit,
          offset,
          hasMore: offset + events.length < totalEvents,
        },
        availableEvents: availableEvents.map((event) => ({
          eventId: event.id,
          eventName: event.name,
        })),
        total,
        totalGeneral,
        totalVip,
        totalOther,
        events: eventsResponse,
      }
    },
  )

  app.get(
    '/cuts/:eventId/rps/:rpId',
    { preHandler: [app.authenticate, app.authorizeScanner] },
    async (request) => {
      const scanner = await resolveScannerProfile(app, request.user?.userId)
      const params = cutDetailParamsSchema.parse(request.params)
      const query = cutDetailQuerySchema.parse(request.query)
      const range = normalizeRange(app, query.from, query.to)
      const limit = query.limit ?? 50
      const offset = query.offset ?? 0

      const event = await prisma.event.findUnique({
        where: { id: params.eventId },
        include: {
          club: {
            select: {
              managerId: true,
            },
          },
        },
      })

      if (!event) {
        throw app.httpErrors.notFound('Evento no encontrado')
      }

      if (event.club.managerId !== scanner.managerId) {
        throw app.httpErrors.forbidden('No puedes acceder a este evento')
      }

      const rp = await prisma.rpProfile.findUnique({
        where: { id: params.rpId },
        include: {
          user: true,
        },
      })

      if (!rp) {
        throw app.httpErrors.notFound('RP no encontrado')
      }

      if (rp.managerId !== scanner.managerId) {
        throw app.httpErrors.forbidden('No puedes acceder al RP indicado')
      }

      const managerSetting = await prisma.managerSetting.findUnique({
        where: { managerId: scanner.managerId },
      })
      const otherLabel = managerSetting?.otherLabel ?? 'Otro'

      const detailWhere = {
        ticket: {
          eventId: params.eventId,
          rpId: params.rpId,
        },
        ...(range.scannedAt ? { scannedAt: range.scannedAt } : {}),
      } as const

      const totalScans = await prisma.ticketScan.count({
        where: detailWhere,
      })

      const scans = await prisma.ticketScan.findMany({
        where: detailWhere,
        include: {
          ticket: {
            select: {
              id: true,
              guestType: true,
              note: true,
            },
          },
          scanner: {
            include: {
              user: true,
            },
          },
        },
        orderBy: { scannedAt: 'desc' },
        take: limit,
        skip: offset,
      })

      return {
        event: {
          id: event.id,
          name: event.name,
          startsAt: event.startsAt.toISOString(),
          endsAt: event.endsAt.toISOString(),
        },
        rp: {
          id: rp.id,
          name: rp.user.name,
        },
        total: totalScans,
        pagination: {
          limit,
          offset,
          hasMore: offset + scans.length < totalScans,
        },
        scans: scans.map((scan) => ({
          ticketId: scan.ticketId,
          guestType: scan.ticket.guestType,
          displayLabel: scan.ticket.guestType === 'OTHER' ? otherLabel : scan.ticket.guestType,
          note: scan.ticket.note,
          scannedAt: scan.scannedAt.toISOString(),
          scannerName: scan.scanner?.user?.name ?? 'Scanner',
        })),
      }
    },
  )
}

function aggregateScans(
  scans: Array<{
    ticket: {
      eventId: string
      rpId: string
      guestType: TicketType
    }
  }>,
) {
  const totals = createEmptyCounters()
  const events = new Map<string, { totals: GuestCounters; rps: Map<string, GuestCounters> }>()

  for (const scan of scans) {
    totals[scan.ticket.guestType] += 1

    const eventEntry = events.get(scan.ticket.eventId) ?? {
      totals: createEmptyCounters(),
      rps: new Map<string, GuestCounters>(),
    }

    eventEntry.totals[scan.ticket.guestType] += 1

    const rpEntry = eventEntry.rps.get(scan.ticket.rpId) ?? createEmptyCounters()
    rpEntry[scan.ticket.guestType] += 1
    eventEntry.rps.set(scan.ticket.rpId, rpEntry)

    events.set(scan.ticket.eventId, eventEntry)
  }

  return { totals, events }
}

function normalizeRange(app: FastifyInstance, from?: string, to?: string) {
  const result: { scannedAt?: { gte?: Date; lte?: Date } } = {}
  const fromDate = from ? new Date(from) : undefined
  const toDate = to ? new Date(to) : undefined

  if (fromDate && Number.isNaN(fromDate.getTime())) {
    throw app.httpErrors.badRequest('El parametro "from" es invalido')
  }

  if (toDate && Number.isNaN(toDate.getTime())) {
    throw app.httpErrors.badRequest('El parametro "to" es invalido')
  }

  if (fromDate && toDate && toDate < fromDate) {
    throw app.httpErrors.badRequest('El rango de fechas es invalido')
  }

  if (fromDate || toDate) {
    result.scannedAt = {}
    if (fromDate) {
      result.scannedAt.gte = fromDate
    }
    if (toDate) {
      result.scannedAt.lte = toDate
    }
  }

  return result
}

async function resolveScannerProfile(app: FastifyInstance, userId?: string) {
  if (!userId) {
    throw app.httpErrors.unauthorized('Scanner token requerido')
  }

  const scanner = await prisma.scannerProfile.findFirst({
    where: { userId, active: true },
  })

  if (!scanner) {
    throw app.httpErrors.forbidden('Scanner no autorizado o inactivo')
  }

  return scanner
}

async function ensureEventBelongsToScannerManager(app: FastifyInstance, eventId: string, managerId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      club: {
        select: {
          managerId: true,
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
}
