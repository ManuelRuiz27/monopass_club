import { FastifyInstance, FastifyReply } from 'fastify'
import { z } from 'zod'
import { TicketType } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { randomUUID } from 'crypto'
import QRCode from 'qrcode'
import { Jimp, JimpMime } from 'jimp'

type JimpImage = Awaited<ReturnType<typeof Jimp.read>>

const createTicketSchema = z.object({
  eventId: z.string().uuid(),
  guestType: z.nativeEnum(TicketType),
  note: z.string().max(280).optional().nullable(),
})

const ticketParamsSchema = z.object({
  ticketId: z.string().uuid(),
})

export async function registerTicketRoutes(app: FastifyInstance) {
  app.post('/tickets', { preHandler: [app.authenticate, app.authorizeRp] }, async (request, reply) => {
    const body = createTicketSchema.parse(request.body)
    const rpProfile = await prisma.rpProfile.findFirst({
      where: { userId: request.user!.userId, active: true },
    })

    if (!rpProfile) {
      throw app.httpErrors.forbidden('RP no autorizado o inactivo')
    }

    const assignment = await prisma.eventRp.findFirst({
      where: { eventId: body.eventId, rpId: rpProfile.id },
      include: {
        event: true,
      },
    })

    if (!assignment) {
      throw app.httpErrors.notFound('Evento no asignado al RP')
    }

    if (!assignment.event.active) {
      throw app.httpErrors.conflict('El evento esta inactivo')
    }

    let generated = await prisma.ticket.count({
      where: { assignmentId: assignment.id },
    })

    if (assignment.limitAccesses && generated >= assignment.limitAccesses) {
      throw app.httpErrors.conflict('Limite de accesos alcanzado')
    }

    const ticketId = randomUUID()
    const qrToken = ticketId

    const ticket = await prisma.ticket.create({
      data: {
        id: ticketId,
        eventId: assignment.eventId,
        rpId: rpProfile.id,
        assignmentId: assignment.id,
        guestType: body.guestType,
        note: body.note ?? null,
        qrToken,
      },
    })

    generated += 1

    reply.code(201)

    return {
      id: ticket.id,
      guestType: ticket.guestType,
      note: ticket.note,
      status: ticket.status,
      event: {
        id: assignment.event.id,
        name: assignment.event.name,
        startsAt: assignment.event.startsAt,
        endsAt: assignment.event.endsAt,
      },
      limitAccesses: assignment.limitAccesses,
      usedAccesses: generated,
      remainingAccesses: assignment.limitAccesses ? Math.max(assignment.limitAccesses - generated, 0) : null,
    }
  })

  const sendTicketPng = async (ticketId: string, reply: FastifyReply) => {
    const ticket = await prisma.ticket.findFirst({
      where: { id: ticketId },
      include: {
        event: true,
      },
    })

    if (!ticket) {
      throw app.httpErrors.notFound('Ticket no encontrado')
    }

    const pngBuffer = await buildTicketImage(ticket.qrToken, ticket.event)

    reply
      .header('Content-Type', 'image/png')
      .header('Content-Disposition', `inline; filename="ticket-${ticket.id}.png"`)
      .send(pngBuffer)
  }

  app.get('/tickets/:ticketId/png', async (request, reply) => {
    const params = ticketParamsSchema.parse(request.params)
    await sendTicketPng(params.ticketId, reply)
  })

  // Legacy alias until frontend actualiza consumos
  app.get('/tickets/:ticketId/image', async (request, reply) => {
    const params = ticketParamsSchema.parse(request.params)
    await sendTicketPng(params.ticketId, reply)
  })
}

async function buildTicketImage(
  qrToken: string,
  event: {
    templateImageUrl: string | null
    qrPositionX: number | null
    qrPositionY: number | null
    qrSize: number | null
  },
) {
  const baseImage = await loadBaseImage(event.templateImageUrl)
  const size = calculateQrSize(baseImage, event.qrSize)
  const qrBuffer = await QRCode.toBuffer(qrToken, { width: size, margin: 1 })
  const qrImage = await Jimp.read(qrBuffer)

  const position = calculateQrPosition(baseImage, qrImage, event.qrPositionX, event.qrPositionY)
  baseImage.composite(qrImage, position.x, position.y)

  return baseImage.getBuffer(JimpMime.png)
}

async function loadBaseImage(templateUrl: string | null): Promise<JimpImage> {
  if (templateUrl) {
    if (templateUrl.startsWith('data:')) {
      const base64 = templateUrl.split(',')[1]
      if (base64) {
        try {
          return await Jimp.read(Buffer.from(base64, 'base64'))
        } catch {
          // fallback to fetch/default below
        }
      }
    } else {
      try {
        const response = await fetch(templateUrl)
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer()
          return await Jimp.read(Buffer.from(arrayBuffer))
        }
      } catch {
        // fallback to default background if fetch fails
      }
    }
  }

  return new Jimp({ width: 1024, height: 1024, color: 0x0f172aff }) as JimpImage
}

function calculateQrSize(image: JimpImage, desiredSize: number | null) {
  const baseSize = Math.min(image.width, image.height)

  if (desiredSize && desiredSize > 0) {
    if (desiredSize <= 1) {
      return Math.max(180, Math.round(baseSize * desiredSize))
    }
    return Math.max(180, Math.round(desiredSize))
  }

  return Math.round(baseSize * 0.35)
}

function calculateQrPosition(
  base: JimpImage,
  qr: JimpImage,
  relativeX: number | null,
  relativeY: number | null,
) {
  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
  const defaultRelative = 0.5
  const ratioX = clamp(relativeX ?? defaultRelative, 0, 1)
  const ratioY = clamp(relativeY ?? defaultRelative, 0, 1)

  const maxX = Math.max(base.width - qr.width, 0)
  const maxY = Math.max(base.height - qr.height, 0)
  const centerX = base.width * ratioX
  const centerY = base.height * ratioY
  return {
    x: clamp(Math.round(centerX - qr.width / 2), 0, maxX),
    y: clamp(Math.round(centerY - qr.height / 2), 0, maxY),
  }
}
