import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { TicketType } from '@prisma/client'

const aggregateQuerySchema = z.object({
  eventId: z.string().uuid().optional(),
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

      const events = await prisma.event.findMany({
        where: {
          ...(query.eventId ? { id: query.eventId } : {}),
          club: { managerId },
        },
        include: {
          club: { select: { name: true } },
          assignments: {
            include: {
              rp: { include: { user: true } },
            },
          },
        },
        orderBy: { startsAt: 'desc' },
      })

      if (events.length === 0) {
        return { events: [] }
      }

      const eventIds = events.map((event) => event.id)
      const scans = await prisma.ticketScan.findMany({
        where: {
          ticket: {
            eventId: { in: eventIds },
          },
          ...(query.from
            ? {
                scannedAt: {
                  gte: new Date(query.from),
                  lte: query.to ? new Date(query.to) : undefined,
                },
              }
            : query.to
              ? { scannedAt: { lte: new Date(query.to) } }
              : {}),
        },
        include: {
          ticket: {
            select: {
              id: true,
              guestType: true,
              note: true,
              eventId: true,
              rpId: true,
            },
          },
        },
        orderBy: { scannedAt: 'desc' },
      })

      const eventsMap = new Map<
        string,
        {
          totals: GuestCounters
          rps: Map<string, GuestCounters>
        }
      >()

      for (const scan of scans) {
        const eventTotals = eventsMap.get(scan.ticket.eventId) ?? {
          totals: createEmptyCounters(),
          rps: new Map(),
        }
        eventTotals.totals[scan.ticket.guestType] += 1

        const rpTotals = eventTotals.rps.get(scan.ticket.rpId) ?? createEmptyCounters()
        rpTotals[scan.ticket.guestType] += 1
        eventTotals.rps.set(scan.ticket.rpId, rpTotals)

        eventsMap.set(scan.ticket.eventId, eventTotals)
      }

      return {
        events: events.map((event) => {
          const aggregates = eventsMap.get(event.id) ?? {
            totals: createEmptyCounters(),
            rps: new Map<string, GuestCounters>(),
          }

          const rpRows = new Map<string, GuestCounters>(aggregates.rps)
          for (const assignment of event.assignments) {
            if (!rpRows.has(assignment.rpId)) {
              rpRows.set(assignment.rpId, createEmptyCounters())
            }
          }

          const rpSummaries = Array.from(rpRows.entries()).map(([rpId, counters]) => {
            const rpName =
              event.assignments.find((assignment) => assignment.rpId === rpId)?.rp.user.name ?? 'RP removido'
            const totalScanned = counters.GENERAL + counters.VIP + counters.OTHER
            return {
              rpId,
              rpName,
              totalGeneral: counters.GENERAL,
              totalVip: counters.VIP,
              totalOther: counters.OTHER,
              totalScanned,
            }
          })

          const totalScanned = aggregates.totals.GENERAL + aggregates.totals.VIP + aggregates.totals.OTHER

          return {
            eventId: event.id,
            eventName: event.name,
            startsAt: event.startsAt,
            endsAt: event.endsAt,
            clubName: event.club.name,
            totalGeneral: aggregates.totals.GENERAL,
            totalVip: aggregates.totals.VIP,
            totalOther: aggregates.totals.OTHER,
            totalScanned,
            rps: rpSummaries.sort((a, b) => b.totalScanned - a.totalScanned),
          }
        }),
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

      const event = await prisma.event.findFirst({
        where: { id: params.eventId, club: { managerId } },
        select: { id: true, name: true, startsAt: true, endsAt: true },
      })

      if (!event) {
        throw app.httpErrors.notFound('Evento no encontrado')
      }

      const rp = await prisma.rpProfile.findFirst({
        where: { id: params.rpId, managerId },
        include: { user: true },
      })

      if (!rp) {
        throw app.httpErrors.notFound('RP no encontrado')
      }

      const managerSetting = await prisma.managerSetting.findUnique({ where: { managerId } })
      const otherLabel = managerSetting?.otherLabel ?? 'Otro'

      const scans = await prisma.ticketScan.findMany({
        where: {
          ticket: {
            eventId: params.eventId,
            rpId: params.rpId,
          },
          ...(query.from
            ? {
                scannedAt: {
                  gte: new Date(query.from),
                  lte: query.to ? new Date(query.to) : undefined,
                },
              }
            : query.to
              ? { scannedAt: { lte: new Date(query.to) } }
              : {}),
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
        event,
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
