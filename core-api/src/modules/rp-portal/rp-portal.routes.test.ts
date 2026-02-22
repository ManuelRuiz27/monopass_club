import request from 'supertest'
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest'
import { randomUUID } from 'crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { buildServer } from '../../server'
import { prisma } from '../../lib/prisma'
import { hashPassword } from '../../lib/password'
import { TicketDeliveryMethod, TicketType, UserRole } from '@prisma/client'
import { Jimp } from 'jimp'

describe.sequential('RP portal endpoints', () => {
  let app: Awaited<ReturnType<typeof buildServer>>
  const createdUserIds = new Set<string>()
  const templateImagePath = path.resolve(__dirname, '../../../../frontend/src/stories/assets/assets.png')
  const templateDataUrl = `data:image/png;base64,${readFileSync(templateImagePath).toString('base64')}`
  let templateReferenceColor: number
  let createdTicketDeliveryTypeForTests = false
  let createdTicketDeliveryTableForTests = false

  beforeAll(async () => {
    app = await buildServer()
    await app.ready()
    const ticketDeliveryTypeExists = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
      `SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TicketDeliveryMethod') AS "exists";`,
    )
    if (!ticketDeliveryTypeExists[0]?.exists) {
      await prisma.$executeRawUnsafe(`CREATE TYPE "TicketDeliveryMethod" AS ENUM ('WHATSAPP', 'DOWNLOAD');`)
      createdTicketDeliveryTypeForTests = true
    }

    const ticketDeliveryTableExists = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
      `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'TicketDelivery') AS "exists";`,
    )
    if (!ticketDeliveryTableExists[0]?.exists) {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE "TicketDelivery" (
          "id" TEXT NOT NULL,
          "ticketId" TEXT NOT NULL,
          "rpId" TEXT NOT NULL,
          "method" "TicketDeliveryMethod" NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "TicketDelivery_pkey" PRIMARY KEY ("id")
        );
      `)
      createdTicketDeliveryTableForTests = true
    }

    const templateReferenceImage = await Jimp.read(templateImagePath)
    templateReferenceColor = templateReferenceImage.getPixelColor(5, 5)
  })

  afterAll(async () => {
    if (createdTicketDeliveryTableForTests) {
      await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "TicketDelivery";`)
    }
    if (createdTicketDeliveryTypeForTests) {
      await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "TicketDeliveryMethod";`)
    }
    await app.close()
  })

  afterEach(async () => {
    if (createdUserIds.size > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: Array.from(createdUserIds) } },
      })
      createdUserIds.clear()
    }
  })

  async function createManager() {
    const id = randomUUID()
    const username = `manager_${id.slice(0, 5)}`
    const password = `Pwd-${id.slice(0, 4)}`

    await prisma.user.create({
      data: {
        id,
        name: 'Test Manager',
        username,
        password: await hashPassword(password),
        role: UserRole.MANAGER,
      },
    })

    createdUserIds.add(id)
    return { id }
  }

  async function createRp(managerId: string) {
    const userId = randomUUID()
    const username = `rp_${userId.slice(0, 5)}`
    const password = `Pwd-${userId.slice(0, 4)}`

    await prisma.user.create({
      data: {
        id: userId,
        name: 'RP Test',
        username,
        password: await hashPassword(password),
        role: UserRole.RP,
      },
    })

    createdUserIds.add(userId)

    const profile = await prisma.rpProfile.create({
      data: {
        id: randomUUID(),
        managerId,
        userId,
      },
    })

    const loginResponse = await request(app.server).post('/auth/login').send({
      username,
      password,
    })

    expect(loginResponse.status).toBe(200)
    return { profile, token: loginResponse.body.token as string }
  }

  async function createEventWithAssignment(managerId: string, rpId: string, limitAccesses: number | null) {
    const club = await prisma.club.create({
      data: {
        id: randomUUID(),
        managerId,
        name: 'Club RP',
        capacity: 500,
      },
    })

    const event = await prisma.event.create({
      data: {
        id: randomUUID(),
        clubId: club.id,
        name: 'Evento RP',
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 3600000),
      },
    })

    const assignment = await prisma.eventRp.create({
      data: {
        id: randomUUID(),
        eventId: event.id,
        rpId,
        limitAccesses,
      },
    })

    return { event, assignment }
  }

  test('GET /rp/events devuelve asignaciones y contadores por tipo', async () => {
    const manager = await createManager()
    const { profile, token } = await createRp(manager.id)
    const { assignment } = await createEventWithAssignment(manager.id, profile.id, 5)

    await prisma.ticket.create({
      data: {
        id: randomUUID(),
        eventId: assignment.eventId,
        rpId: profile.id,
        assignmentId: assignment.id,
        guestType: TicketType.GENERAL,
        qrToken: randomUUID(),
      },
    })

    await prisma.ticket.create({
      data: {
        id: randomUUID(),
        eventId: assignment.eventId,
        rpId: profile.id,
        assignmentId: assignment.id,
        guestType: TicketType.VIP,
        qrToken: randomUUID(),
      },
    })

    const response = await request(app.server).get('/rp/events').set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.events).toHaveLength(1)
    const eventInfo = response.body.events[0]
    expect(eventInfo.limitAccesses).toBe(5)
    expect(eventInfo.usedAccesses).toBe(2)
    expect(eventInfo.guestTypeCounts.GENERAL).toBe(1)
    expect(eventInfo.guestTypeCounts.VIP).toBe(1)
  })

  test('POST /tickets respeta el limite y GET /tickets/:id/image responde PNG', async () => {
    const manager = await createManager()
    const { profile, token } = await createRp(manager.id)
    const { event } = await createEventWithAssignment(manager.id, profile.id, 1)

    const createResponse = await request(app.server)
      .post('/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        eventId: event.id,
        guestType: TicketType.OTHER,
        note: 'Mesa 4',
      })

    expect(createResponse.status).toBe(201)
    expect(createResponse.body.remainingAccesses).toBe(0)
    expect(createResponse.body.guestType).toBe(TicketType.OTHER)

    const duplicateResponse = await request(app.server)
      .post('/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        eventId: event.id,
        guestType: TicketType.GENERAL,
      })

    expect(duplicateResponse.status).toBe(409)

    const imageResponse = await request(app.server)
      .get(`/tickets/${createResponse.body.id}/image`)
      .set('Authorization', `Bearer ${token}`)

    expect(imageResponse.status).toBe(200)
    expect(imageResponse.headers['content-type']).toBe('image/png')
  })

  test('GET /tickets/:id/png usa plantilla cargada por el manager', async () => {
    const manager = await createManager()
    const { profile, token } = await createRp(manager.id)
    const { event } = await createEventWithAssignment(manager.id, profile.id, null)

    await prisma.event.update({
      where: { id: event.id },
      data: {
        templateImageUrl: templateDataUrl,
        qrPositionX: 0.8,
        qrPositionY: 0.8,
        qrSize: 0.2,
      },
    })

    const createResponse = await request(app.server)
      .post('/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        eventId: event.id,
        guestType: TicketType.GENERAL,
      })

    expect(createResponse.status).toBe(201)

    const imageResponse = await request(app.server)
      .get(`/tickets/${createResponse.body.id}/png`)
      .set('Authorization', `Bearer ${token}`)
      .buffer(true)
      .parse(binaryParser)

    expect(imageResponse.status).toBe(200)
    const image = await Jimp.read(imageResponse.body)
    expect(image.bitmap.width).toBe(580)
    expect(image.bitmap.height).toBe(260)
    expect(image.getPixelColor(5, 5)).toBe(templateReferenceColor)
  })

  test('GET /tickets/:id/png bloquea acceso a tickets de otro RP', async () => {
    const manager = await createManager()
    const rpOwner = await createRp(manager.id)
    const rpOther = await createRp(manager.id)
    const { event } = await createEventWithAssignment(manager.id, rpOwner.profile.id, null)

    const createResponse = await request(app.server)
      .post('/tickets')
      .set('Authorization', `Bearer ${rpOwner.token}`)
      .send({
        eventId: event.id,
        guestType: TicketType.GENERAL,
      })

    expect(createResponse.status).toBe(201)

    const forbiddenResponse = await request(app.server)
      .get(`/tickets/${createResponse.body.id}/png`)
      .set('Authorization', `Bearer ${rpOther.token}`)

    expect(forbiddenResponse.status).toBe(404)
  })

  test('GET /rp/tickets/history expone canal y hora de envio sin datos de escaneo', async () => {
    const manager = await createManager()
    const { profile, token } = await createRp(manager.id)
    const { assignment } = await createEventWithAssignment(manager.id, profile.id, null)

    const createdTicket = await prisma.ticket.create({
      data: {
        id: randomUUID(),
        eventId: assignment.eventId,
        rpId: profile.id,
        assignmentId: assignment.id,
        guestType: TicketType.GENERAL,
        qrToken: randomUUID(),
      },
    })

    await prisma.ticketScan.create({
      data: {
        id: randomUUID(),
        ticketId: createdTicket.id,
      },
    })

    const createdDelivery = await prisma.ticketDelivery.create({
      data: {
        id: randomUUID(),
        ticketId: createdTicket.id,
        rpId: profile.id,
        method: TicketDeliveryMethod.WHATSAPP,
      },
    })

    const response = await request(app.server).get('/rp/tickets/history').set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.tickets).toHaveLength(1)
    expect(response.body.tickets[0].id).toBe(createdTicket.id)
    expect(response.body.tickets[0].deliveryMethod).toBe(TicketDeliveryMethod.WHATSAPP)
    expect(new Date(response.body.tickets[0].deliveryAt).toISOString()).toBe(createdDelivery.createdAt.toISOString())
    expect(response.body.tickets[0].scan).toBeUndefined()
    expect(response.body.tickets[0].scannedAt).toBeUndefined()
  })

  test('POST /rp/tickets/:ticketId/delivery registra envio y evita registrar tickets de otro RP', async () => {
    const manager = await createManager()
    const owner = await createRp(manager.id)
    const other = await createRp(manager.id)
    const { assignment } = await createEventWithAssignment(manager.id, owner.profile.id, null)

    const ticket = await prisma.ticket.create({
      data: {
        id: randomUUID(),
        eventId: assignment.eventId,
        rpId: owner.profile.id,
        assignmentId: assignment.id,
        guestType: TicketType.VIP,
        qrToken: randomUUID(),
      },
    })

    const response = await request(app.server)
      .post(`/rp/tickets/${ticket.id}/delivery`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ method: TicketDeliveryMethod.DOWNLOAD })

    expect(response.status).toBe(200)
    expect(response.body.ok).toBe(true)
    expect(response.body.ticketId).toBe(ticket.id)
    expect(response.body.method).toBe(TicketDeliveryMethod.DOWNLOAD)
    expect(response.body.deliveredAt).toBeTruthy()

    const createdDelivery = await prisma.ticketDelivery.findFirst({
      where: {
        ticketId: ticket.id,
        rpId: owner.profile.id,
        method: TicketDeliveryMethod.DOWNLOAD,
      },
    })
    expect(createdDelivery).not.toBeNull()

    const forbiddenResponse = await request(app.server)
      .post(`/rp/tickets/${ticket.id}/delivery`)
      .set('Authorization', `Bearer ${other.token}`)
      .send({ method: TicketDeliveryMethod.WHATSAPP })

    expect(forbiddenResponse.status).toBe(404)
  })

  function binaryParser(res: NodeJS.ReadableStream, callback: (err: Error | null, data?: Buffer) => void) {
    const chunks: Buffer[] = []
    res.on('data', (chunk: Buffer | string) => {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk, 'binary') : chunk)
    })
    res.on('end', () => callback(null, Buffer.concat(chunks)))
  }
})
