import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { TicketType } from '@prisma/client'

const aggregateQuerySchema = z.object({
  eventId: z.string().uuid().optional(),
  rpId: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
})

const detailParamsSchema = z.object({
  eventId: z.string().uuid(),
  rpId: z.string().uuid(),
})

const detailQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
})

type GuestCounters = Record<TicketType, number>

function createEmptyCounters(): GuestCounters {
  return {
    GENERAL: 0,
    VIP: 0,
    OTHER: 0,
  }
}

export async function registerCutRoutes(app: FastifyInstance) {
  app.get(
    '/cuts',
    { preHandler: [app.authenticate, app.authorizeManager] },
    async (request) => {
      const managerId = request.user!.userId
      const query = aggregateQuerySchema.parse(request.query)
      const range = normalizeRange(app, query.from, query.to)

      if (query.eventId) {
        await ensureEventBelongsToManager(app, managerId, query.eventId)
      }

      if (query.rpId) {
        await ensureRpBelongsToManager(app, managerId, query.rpId)
      }

      const events = await prisma.event.findMany({
        where: {
          club: { managerId },
          ...(query.eventId ? { id: query.eventId } : {}),
        },
        include: {
          club: { select: { id: true, name: true } },
          assignments: {
            include: {
              rp: { include: { user: true } },
            },
          },
        },
        orderBy: { startsAt: 'desc' },
      })

      if (events.length === 0) {
        return {
          filters: buildFilterMetadata(query),
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
            ...(query.rpId ? { rpId: query.rpId } : {}),
          },
        },
        include: {
          ticket: {
            select: {
              id: true,
              guestType: true,
              eventId: true,
              rpId: true,
            },
          },
        },
      })

      const aggregated = aggregateScans(scans)

      const eventsResponse = events
        .map((event) => {
          const aggregates = aggregated.events.get(event.id) ?? { totals: createEmptyCounters(), rps: new Map<string, GuestCounters>() }
          const eventTotals = aggregates.totals

          const rpTotalsWithAssignments = new Map(aggregates.rps)
          for (const assignment of event.assignments) {
            if (!rpTotalsWithAssignments.has(assignment.rpId)) {
              rpTotalsWithAssignments.set(assignment.rpId, createEmptyCounters())
            }
          }

          const rpSummaries = Array.from(rpTotalsWithAssignments.entries())
            .map(([rpId, counters]) => {
              const rpName = event.assignments.find((assignment) => assignment.rpId === rpId)?.rp.user.name ?? 'RP removido'
              const total = counters.GENERAL + counters.VIP + counters.OTHER
              return {
                rpId,
                rpName,
                totalGeneral: counters.GENERAL,
                totalVip: counters.VIP,
                totalOther: counters.OTHER,
                total,
              }
            })
            .filter((rpSummary) => (query.rpId ? rpSummary.rpId === query.rpId : true))
            .sort((a, b) => b.total - a.total)

          if (query.rpId && rpSummaries.length === 0) {
            return null
          }

          const total = eventTotals.GENERAL + eventTotals.VIP + eventTotals.OTHER

          return {
            eventId: event.id,
            eventName: event.name,
            startsAt: event.startsAt,
            endsAt: event.endsAt,
            clubName: event.club.name,
            totalGeneral: eventTotals.GENERAL,
            totalVip: eventTotals.VIP,
            totalOther: eventTotals.OTHER,
            total,
            rps: rpSummaries,
          }
        })
        .filter((eventSummary): eventSummary is NonNullable<typeof eventSummary> => Boolean(eventSummary))

      const globalTotalGeneral = aggregated.totals.GENERAL
      const globalTotalVip = aggregated.totals.VIP
      const globalTotalOther = aggregated.totals.OTHER
      const globalTotal = globalTotalGeneral + globalTotalVip + globalTotalOther

      return {
        filters: buildFilterMetadata(query),
        total: globalTotal,
        totalGeneral: globalTotalGeneral,
        totalVip: globalTotalVip,
        totalOther: globalTotalOther,
        events: eventsResponse,
      }
    },
  )

  app.get(
    '/cuts/:eventId/rps/:rpId',
    { preHandler: [app.authenticate, app.authorizeManager] },
    async (request) => {
      const managerId = request.user!.userId
      const params = detailParamsSchema.parse(request.params)
      const query = detailQuerySchema.parse(request.query)
      const range = normalizeRange(app, query.from, query.to)

      const event = await prisma.event.findUnique({
        where: { id: params.eventId },
        select: { id: true, name: true, startsAt: true, endsAt: true, club: { select: { managerId: true } } },
      })

      if (!event) {
        throw app.httpErrors.notFound('Evento no encontrado')
      }

      if (event.club.managerId !== managerId) {
        throw app.httpErrors.forbidden('No puedes acceder a este evento')
      }

      const rp = await prisma.rpProfile.findUnique({
        where: { id: params.rpId },
        include: { user: true },
      })

      if (!rp) {
        throw app.httpErrors.notFound('RP no encontrado')
      }

      if (rp.managerId !== managerId) {
        throw app.httpErrors.forbidden('No puedes acceder al RP indicado')
      }

      const managerSetting = await prisma.managerSetting.findUnique({ where: { managerId } })
      const otherLabel = managerSetting?.otherLabel ?? 'Otro'

      const scans = await prisma.ticketScan.findMany({
        where: {
          ticket: {
            eventId: params.eventId,
            rpId: params.rpId,
          },
          ...(range.scannedAt ? { scannedAt: range.scannedAt } : {}),
        },
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
      })

      return {
        event: {
          id: event.id,
          name: event.name,
          startsAt: event.startsAt,
          endsAt: event.endsAt,
        },
        rp: { id: rp.id, name: rp.user.name },
        total: scans.length,
        scans: scans.map((scan) => ({
          ticketId: scan.ticketId,
          guestType: scan.ticket.guestType,
          displayLabel: scan.ticket.guestType === 'OTHER' ? otherLabel : scan.ticket.guestType,
          note: scan.ticket.note,
          scannedAt: scan.scannedAt,
          scannerName: scan.scanner?.user?.name ?? 'Scanner',
        })),
      }
    },
  )
}

function aggregateScans(
  scans: Array<{
    ticket: {
      guestType: TicketType
      eventId: string
      rpId: string
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

async function ensureEventBelongsToManager(app: FastifyInstance, managerId: string, eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, club: { select: { managerId: true } } },
  })

  if (!event) {
    throw app.httpErrors.notFound('Evento no encontrado')
  }

  if (event.club.managerId !== managerId) {
    throw app.httpErrors.forbidden('No puedes consultar eventos de otro manager')
  }
}

async function ensureRpBelongsToManager(app: FastifyInstance, managerId: string, rpId: string) {
  const rp = await prisma.rpProfile.findUnique({
    where: { id: rpId },
    select: { id: true, managerId: true },
  })

  if (!rp) {
    throw app.httpErrors.notFound('RP no encontrado')
  }

  if (rp.managerId !== managerId) {
    throw app.httpErrors.forbidden('No puedes consultar datos de otro manager')
  }
}

function buildFilterMetadata(query: z.infer<typeof aggregateQuerySchema>) {
  return {
    eventId: query.eventId ?? null,
    rpId: query.rpId ?? null,
    from: query.from ?? null,
    to: query.to ?? null,
  }
}
