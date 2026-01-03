import request from 'supertest'
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest'
import { randomUUID } from 'crypto'
import { TicketStatus, TicketType, UserRole } from '@prisma/client'
import { buildServer } from '../../server'
import { prisma } from '../../lib/prisma'

describe.sequential('scan routes', () => {
  let app: Awaited<ReturnType<typeof buildServer>>
  const created = {
    users: new Set<string>(),
    managerSettings: new Set<string>(),
    clubs: new Set<string>(),
    events: new Set<string>(),
    rpProfiles: new Set<string>(),
    scannerProfiles: new Set<string>(),
    eventRps: new Set<string>(),
    tickets: new Set<string>(),
    ticketScans: new Set<string>(),
  }

  beforeAll(async () => {
    app = await buildServer()
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  afterEach(async () => {
    await prisma.$executeRaw`DELETE FROM "ScannerConfirmRequest"`
    await prisma.ticketScan.deleteMany({ where: { id: { in: Array.from(created.ticketScans) } } })
    await prisma.ticket.deleteMany({ where: { id: { in: Array.from(created.tickets) } } })
    await prisma.eventRp.deleteMany({ where: { id: { in: Array.from(created.eventRps) } } })
    await prisma.event.deleteMany({ where: { id: { in: Array.from(created.events) } } })
    await prisma.club.deleteMany({ where: { id: { in: Array.from(created.clubs) } } })
    await prisma.rpProfile.deleteMany({ where: { id: { in: Array.from(created.rpProfiles) } } })
    await prisma.scannerProfile.deleteMany({ where: { id: { in: Array.from(created.scannerProfiles) } } })
    await prisma.managerSetting.deleteMany({ where: { id: { in: Array.from(created.managerSettings) } } })
    await prisma.user.deleteMany({ where: { id: { in: Array.from(created.users) } } })

    Object.values(created).forEach((set) => set.clear())
  })

  test('validate returns invalid when qr token no existe', async () => {
    const manager = await createManager()
    const scanner = await createScanner(manager.id)

    const response = await request(app.server)
      .post('/scan/validate')
      .set('Authorization', `Bearer ${scanner.token}`)
      .send({ qrToken: 'token-inexistente-123456' })

    expect(response.status).toBe(200)
    expect(response.body.valid).toBe(false)
    expect(response.body.reason).toBe('INVALID_TOKEN')
  })

  test('validate retorna ALREADY_SCANNED cuando el ticket ya tiene scan', async () => {
    const { manager, ticket, scannerToken } = await createTicketFixture({ scanned: true })

    const response = await request(app.server)
      .post('/scan/validate')
      .set('Authorization', `Bearer ${scannerToken}`)
      .send({ qrToken: ticket.qrToken })

    expect(response.status).toBe(200)
    expect(response.body.valid).toBe(false)
    expect(response.body.reason).toBe('ALREADY_SCANNED')
    expect(response.body.ticket.status).toBe('SCANNED')
    expect(response.body.ticket.scannedAt).toBeTruthy()

    // ensure other manager cannot peek
    const otherManager = await createManager()
    const foreignScanner = await createScanner(otherManager.id)
    const forbiddenResp = await request(app.server)
      .post('/scan/validate')
      .set('Authorization', `Bearer ${foreignScanner.token}`)
      .send({ qrToken: ticket.qrToken })

    expect(forbiddenResp.status).toBe(403)
  })

  test('confirm marca ticket como SCANNED e impide reuso', async () => {
    const { ticket, scannerToken } = await createTicketFixture()

    const confirmResponse = await request(app.server)
      .post('/scan/confirm')
      .set('Authorization', `Bearer ${scannerToken}`)
      .send({ qrToken: ticket.qrToken, clientRequestId: randomUUID() })

    expect(confirmResponse.status).toBe(200)
    expect(confirmResponse.body.confirmed).toBe(true)
    expect(confirmResponse.body.ticket.status).toBe('SCANNED')

    const storedTicket = await prisma.ticket.findUniqueOrThrow({ where: { id: ticket.id } })
    expect(storedTicket.status).toBe(TicketStatus.SCANNED)

    const duplicateResponse = await request(app.server)
      .post('/scan/confirm')
      .set('Authorization', `Bearer ${scannerToken}`)
      .send({ qrToken: ticket.qrToken, clientRequestId: randomUUID() })

    expect(duplicateResponse.status).toBe(409)
    expect(duplicateResponse.body.reason).toBe('ALREADY_SCANNED')
  })

  test('confirm responde igual cuando se reintenta con el mismo clientRequestId', async () => {
    const { ticket, scannerToken } = await createTicketFixture()
    const clientRequestId = randomUUID()

    const firstResponse = await request(app.server)
      .post('/scan/confirm')
      .set('Authorization', `Bearer ${scannerToken}`)
      .send({ qrToken: ticket.qrToken, clientRequestId })

    expect(firstResponse.status).toBe(200)
    expect(firstResponse.body.confirmed).toBe(true)

    const retryResponse = await request(app.server)
      .post('/scan/confirm')
      .set('Authorization', `Bearer ${scannerToken}`)
      .send({ qrToken: ticket.qrToken, clientRequestId })

    expect(retryResponse.status).toBe(200)
    expect(retryResponse.body.confirmed).toBe(true)
    expect(retryResponse.body.ticket.ticketId).toBe(ticket.id)
  })

  async function createTicketFixture(options?: { scanned?: boolean }) {
    const manager = await createManager()
    const rp = await createRp(manager.id)
    const club = await createClub(manager.id)
    const event = await createEvent(club.id)
    const assignment = await assignRp(event.id, rp.id)
    const ticket = await createTicket(event.id, rp.id, assignment.id)
    const scanner = await createScanner(manager.id)

    if (options?.scanned) {
      const scan = await prisma.ticketScan.create({
        data: {
          id: randomUUID(),
          ticketId: ticket.id,
          scannerId: scanner.profileId,
        },
      })
      created.ticketScans.add(scan.id)
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { status: TicketStatus.SCANNED },
      })
    }

    return {
      manager,
      rp,
      club,
      event,
      ticket,
      scannerToken: scanner.token,
    }
  }

  async function createManager() {
    const managerId = randomUUID()
    created.users.add(managerId)
    await prisma.user.create({
      data: {
        id: managerId,
        name: 'Manager',
        username: `manager_${managerId.slice(0, 6)}`,
        password: 'hash-not-required',
        role: UserRole.MANAGER,
      },
    })

    const settingId = randomUUID()
    created.managerSettings.add(settingId)
    await prisma.managerSetting.create({
      data: {
        id: settingId,
        managerId,
        otherLabel: 'Otra etiqueta',
      },
    })

    return { id: managerId }
  }

  async function createScanner(managerId: string) {
    const scannerUserId = randomUUID()
    created.users.add(scannerUserId)
    await prisma.user.create({
      data: {
        id: scannerUserId,
        name: 'Scanner User',
        username: `scanner_${scannerUserId.slice(0, 6)}`,
        password: 'hash-not-required',
        role: UserRole.SCANNER,
      },
    })

    const profileId = randomUUID()
    created.scannerProfiles.add(profileId)
    await prisma.scannerProfile.create({
      data: {
        id: profileId,
        managerId,
        userId: scannerUserId,
      },
    })

    return {
      profileId,
      token: app.jwt.sign({ userId: scannerUserId, role: UserRole.SCANNER }),
    }
  }

  async function createRp(managerId: string) {
    const userId = randomUUID()
    created.users.add(userId)
    await prisma.user.create({
      data: {
        id: userId,
        name: 'RP User',
        username: `rp_${userId.slice(0, 6)}`,
        password: 'hash-not-required',
        role: UserRole.RP,
      },
    })

    const profileId = randomUUID()
    created.rpProfiles.add(profileId)
    await prisma.rpProfile.create({
      data: {
        id: profileId,
        managerId,
        userId,
      },
    })

    return { id: profileId }
  }

  async function createClub(managerId: string) {
    const clubId = randomUUID()
    created.clubs.add(clubId)
    await prisma.club.create({
      data: {
        id: clubId,
        managerId,
        name: 'Club Scanner',
        capacity: 500,
      },
    })

    return { id: clubId }
  }

  async function createEvent(clubId: string) {
    const eventId = randomUUID()
    created.events.add(eventId)
    await prisma.event.create({
      data: {
        id: eventId,
        clubId,
        name: 'Evento Scanner',
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 3600000),
      },
    })

    return { id: eventId }
  }

  async function assignRp(eventId: string, rpId: string) {
    const assignmentId = randomUUID()
    created.eventRps.add(assignmentId)
    await prisma.eventRp.create({
      data: {
        id: assignmentId,
        eventId,
        rpId,
        limitAccesses: null,
      },
    })

    return { id: assignmentId }
  }

  async function createTicket(eventId: string, rpId: string, assignmentId: string) {
    const ticketId = randomUUID()
    created.tickets.add(ticketId)
    const qrToken = randomUUID()

    const ticket = await prisma.ticket.create({
      data: {
        id: ticketId,
        eventId,
        rpId,
        assignmentId,
        guestType: TicketType.GENERAL,
        note: 'Lista Scanner',
        qrToken,
      },
    })

    return ticket
  }
})
