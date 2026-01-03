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
  clientRequestId: z.string().uuid(),
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

      const existingRequest = await fetchStoredConfirmRequest(payload.clientRequestId)

      if (existingRequest) {
        if (existingRequest.scannerId !== scanner.id) {
          throw app.httpErrors.forbidden('clientRequestId pertenece a otro scanner')
        }
        return reply.status(existingRequest.statusCode).send(existingRequest.responsePayload as ConfirmResponse)
      }

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
        const responsePayload = await prisma.$transaction(async (tx) => {
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

          const response: ConfirmResponse = {
            confirmed: true,
            reason: null,
            ticket: buildTicketSummary(ticket, otherLabel, {
              status: TicketStatus.SCANNED,
              scannedAt: createdScan.scannedAt,
            }),
          }

          await persistStoredConfirmRequest(tx, {
            clientRequestId: payload.clientRequestId,
            scannerId: scanner.id,
            ticketId: ticket.id,
            responsePayload: response,
            statusCode: 200,
          })

          return response
        })

        return reply.status(200).send(responsePayload)
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          const stored = await fetchStoredConfirmRequest(payload.clientRequestId)

          if (stored && stored.scannerId === scanner.id) {
            return reply.status(stored.statusCode).send(stored.responsePayload as ConfirmResponse)
          }

          throw app.httpErrors.conflict('clientRequestId ya utilizado')
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

type StoredConfirmRequest = {
  id: string
  clientRequestId: string
  scannerId: string
  ticketId: string
  responsePayload: unknown
  statusCode: number
  createdAt: Date
}

type PersistConfirmRequestInput = {
  clientRequestId: string
  scannerId: string
  ticketId: string
  responsePayload: ConfirmResponse
  statusCode: number
}

async function fetchStoredConfirmRequest(clientRequestId: string): Promise<StoredConfirmRequest | null> {
  const rows = await prisma.$queryRaw<StoredConfirmRequest[]>(
    Prisma.sql`
      SELECT "id", "clientRequestId", "scannerId", "ticketId", "responsePayload", "statusCode", "createdAt"
      FROM "ScannerConfirmRequest"
      WHERE "clientRequestId" = ${clientRequestId}
      LIMIT 1
    `,
  )

  return rows[0] ?? null
}

async function persistStoredConfirmRequest(
  tx: Prisma.TransactionClient,
  data: PersistConfirmRequestInput,
): Promise<void> {
  const serializedPayload = JSON.stringify(data.responsePayload)

  await tx.$executeRaw(
    Prisma.sql`
      INSERT INTO "ScannerConfirmRequest"
        ("id", "clientRequestId", "scannerId", "ticketId", "responsePayload", "statusCode")
      VALUES (${randomUUID()}, ${data.clientRequestId}, ${data.scannerId}, ${data.ticketId}, ${serializedPayload}::jsonb, ${data.statusCode})
    `,
  )
}
