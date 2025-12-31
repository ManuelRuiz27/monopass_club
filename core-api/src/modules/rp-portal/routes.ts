import { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma'
import { TicketType } from '@prisma/client'

type GuestTypeCounter = Record<TicketType, number>

const emptyGuestCounters: GuestTypeCounter = {
  GENERAL: 0,
  VIP: 0,
  OTHER: 0,
}

export async function registerRpPortalRoutes(app: FastifyInstance) {
  app.get('/rp/events', { preHandler: [app.authenticate, app.authorizeRp] }, async (request) => {
    const rpProfile = await prisma.rpProfile.findFirst({
      where: { userId: request.user!.userId, active: true },
    })

    if (!rpProfile) {
      throw app.httpErrors.forbidden('RP no autorizado o inactivo')
    }

    const assignments = await prisma.eventRp.findMany({
      where: { rpId: rpProfile.id, event: { active: true } },
      include: {
        event: {
          include: {
            club: { select: { id: true, name: true } },
          },
        },
        _count: { select: { tickets: true } },
      },
      orderBy: { event: { startsAt: 'asc' } },
    })

    const assignmentIds = assignments.map((assignment) => assignment.id)
    const groupedCounts = assignmentIds.length
      ? await prisma.ticket.groupBy({
          by: ['assignmentId', 'guestType'],
          where: { assignmentId: { in: assignmentIds } },
          _count: { _all: true },
        })
      : []

    const countsMap = new Map<string, GuestTypeCounter>()
    for (const counter of groupedCounts) {
      const current = countsMap.get(counter.assignmentId) ?? { ...emptyGuestCounters }
      current[counter.guestType] = counter._count._all
      countsMap.set(counter.assignmentId, current)
    }

    const managerSetting = await prisma.managerSetting.findUnique({
      where: { managerId: rpProfile.managerId },
    })

    return {
      otherLabel: managerSetting?.otherLabel ?? 'Otro',
      events: assignments.map((assignment) => {
        const guestCounts = countsMap.get(assignment.id) ?? { ...emptyGuestCounters }
        const used = assignment._count.tickets
        return {
          assignmentId: assignment.id,
          eventId: assignment.eventId,
          eventName: assignment.event.name,
          clubName: assignment.event.club.name,
          startsAt: assignment.event.startsAt,
          endsAt: assignment.event.endsAt,
          limitAccesses: assignment.limitAccesses,
          usedAccesses: used,
          remainingAccesses: assignment.limitAccesses ? Math.max(assignment.limitAccesses - used, 0) : null,
          guestTypeCounts: guestCounts,
        }
      }),
    }
  })
}
