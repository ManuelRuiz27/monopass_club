import { FastifyInstance } from 'fastify'
import { randomUUID } from 'crypto'
import { Prisma, Ticket, TicketStatus, TicketType } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'

const validateBodySchema = z.object({
  qrToken: z.string().min(16, 'QR token debe permanecer opaco'),
})

const confirmBodySchema = z.object({
  qrToken: z.string().min(16),
  clientRequestId: z.string().uuid().optional(),
})

type TicketSummary = {
  ticketId: string
  eventId: string
  guestType: TicketType
  displayLabel: string
  note: string | null
  status: TicketStatus
  scannedAt: string | null
}

export type ValidateResponse = {
  valid: boolean
  reason: 'ALREADY_SCANNED' | 'INVALID_TOKEN' | null
  ticket: TicketSummary | null
}

export type ConfirmResponse = {
  confirmed: boolean
  reason: 'ALREADY_SCANNED' | 'INVALID_TOKEN' | null
  ticket: TicketSummary | null
}

export async function registerScanRoutes(app: FastifyInstance) {
  app.post(
    '/scan/validate',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { qrToken } = validateBodySchema.parse(request.body)
      const scanner = await resolveScannerProfile(app, request.user?.userId)
      const managerSetting = await prisma.managerSetting.findUnique({
        where: { managerId: scanner.managerId },
      })
      const otherLabel = managerSetting?.otherLabel ?? 'Otro'

      const ticket = await prisma.ticket.findFirst({
        where: { qrToken },
        include: {
          event: { include: { club: { select: { managerId: true } } } },
          scan: true,
        },
      })

      if (!ticket) {
        const response: ValidateResponse = { valid: false, reason: 'INVALID_TOKEN', ticket: null }
        return reply.status(200).send(response)
      }

      if (ticket.event.club.managerId !== scanner.managerId) {
        throw app.httpErrors.forbidden('Ticket pertenece a otro manager')
      }

      if (ticket.scan) {
        const response: ValidateResponse = {
          valid: false,
          reason: 'ALREADY_SCANNED',
          ticket: buildTicketSummary(ticket, otherLabel),
        }
        return reply.status(200).send(response)
      }

      const response: ValidateResponse = {
        valid: true,
        reason: null,
        ticket: buildTicketSummary(ticket, otherLabel),
      }

      return reply.status(200).send(response)
    },
  )

  app.post(
    '/scan/confirm',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const payload = confirmBodySchema.parse(request.body)
      const scanner = await resolveScannerProfile(app, request.user?.userId)
      const managerSetting = await prisma.managerSetting.findUnique({
        where: { managerId: scanner.managerId },
      })
      const otherLabel = managerSetting?.otherLabel ?? 'Otro'

      const ticket = await prisma.ticket.findFirst({
        where: { qrToken: payload.qrToken },
        include: {
          event: { include: { club: { select: { managerId: true } } } },
          scan: true,
        },
      })

      if (!ticket) {
        const response: ConfirmResponse = { confirmed: false, reason: 'INVALID_TOKEN', ticket: null }
        return reply.status(404).send(response)
      }

      if (ticket.event.club.managerId !== scanner.managerId) {
        throw app.httpErrors.forbidden('Ticket pertenece a otro manager')
      }

      if (ticket.scan) {
        const alreadyScanned: ConfirmResponse = {
          confirmed: false,
          reason: 'ALREADY_SCANNED',
          ticket: buildTicketSummary(ticket, otherLabel),
        }
        return reply.status(409).send(alreadyScanned)
      }

      try {
        const scanRecord = await prisma.$transaction(async (tx) => {
          const createdScan = await tx.ticketScan.create({
            data: {
              id: randomUUID(),
              ticketId: ticket.id,
              scannerId: scanner.id,
            },
          })

          await tx.ticket.update({
            where: { id: ticket.id },
            data: { status: TicketStatus.SCANNED },
          })

          return createdScan
        })

        const response: ConfirmResponse = {
          confirmed: true,
          reason: null,
          ticket: buildTicketSummary(ticket, otherLabel, {
            status: TicketStatus.SCANNED,
            scannedAt: scanRecord.scannedAt,
          }),
        }

        return reply.status(200).send(response)
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          const alreadyScanned: ConfirmResponse = {
            confirmed: false,
            reason: 'ALREADY_SCANNED',
            ticket: buildTicketSummary(ticket, otherLabel, {
              status: TicketStatus.SCANNED,
              scannedAt: ticket.scan?.scannedAt ?? new Date(),
            }),
          }
          return reply.status(409).send(alreadyScanned)
        }

        throw error
      }
    },
  )
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

function buildTicketSummary(
  ticket: Ticket & { scan: { scannedAt: Date } | null },
  otherLabel: string,
  overrides?: { status?: TicketStatus; scannedAt?: Date },
): TicketSummary {
  const status = overrides?.status ?? ticket.status
  const scannedAt = overrides?.scannedAt ?? ticket.scan?.scannedAt ?? null

  return {
    ticketId: ticket.id,
    eventId: ticket.eventId,
    guestType: ticket.guestType,
    displayLabel: ticket.guestType === 'OTHER' ? otherLabel : ticket.guestType,
    note: ticket.note,
    status,
    scannedAt: scannedAt ? scannedAt.toISOString() : null,
  }
}
