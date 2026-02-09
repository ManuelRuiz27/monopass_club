import request from 'supertest'
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest'
import { randomUUID } from 'crypto'
import { TicketStatus, TicketType, UserRole } from '@prisma/client'
import { buildServer } from '../../server'
import { prisma } from '../../lib/prisma'

describe.sequential('cuts routes', () => {
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

  test('GET /cuts retorna agregados para scanner autenticado', async () => {
    const manager = await createManager({ otherLabel: 'Invitado Especial' })
    const scanner = await createScanner(manager.id)
    const rp = await createRp(manager.id)
    const club = await createClub(manager.id)
    const event = await createEvent(club.id)
    const assignment = await assignRp(event.id, rp.id)

    await createScannedTicket({ eventId: event.id, rpId: rp.id, assignmentId: assignment.id, scannerId: scanner.profileId, guestType: TicketType.GENERAL })
    await createScannedTicket({ eventId: event.id, rpId: rp.id, assignmentId: assignment.id, scannerId: scanner.profileId, guestType: TicketType.VIP })
    await createTicket({ eventId: event.id, rpId: rp.id, assignmentId: assignment.id, guestType: TicketType.OTHER })

    const response = await request(app.server)
      .get('/cuts')
      .set('Authorization', `Bearer ${scanner.token}`)

    expect(response.status).toBe(200)
    expect(response.body.total).toBe(2)
    expect(response.body.totalGeneral).toBe(1)
    expect(response.body.totalVip).toBe(1)
    expect(response.body.totalOther).toBe(0)
    expect(response.body.events).toHaveLength(1)
    expect(response.body.events[0].rps[0].total).toBe(2)
  })

  test('GET /cuts/:eventId/rps/:rpId retorna detalle y bloquea scanner de otro manager', async () => {
    const manager = await createManager({ otherLabel: 'Invitado Especial' })
    const scanner = await createScanner(manager.id)
    const rp = await createRp(manager.id)
    const club = await createClub(manager.id)
    const event = await createEvent(club.id)
    const assignment = await assignRp(event.id, rp.id)

    await createScannedTicket({ eventId: event.id, rpId: rp.id, assignmentId: assignment.id, scannerId: scanner.profileId, guestType: TicketType.OTHER, note: 'Lista A' })

    const detailResponse = await request(app.server)
      .get(`/cuts/${event.id}/rps/${rp.id}`)
      .set('Authorization', `Bearer ${scanner.token}`)

    expect(detailResponse.status).toBe(200)
    expect(detailResponse.body.total).toBe(1)
    expect(detailResponse.body.scans).toHaveLength(1)
    expect(detailResponse.body.scans[0].displayLabel).toBe('Invitado Especial')
    expect(detailResponse.body.scans[0].note).toBe('Lista A')

    const otherManager = await createManager()
    const foreignScanner = await createScanner(otherManager.id)

    const forbiddenResponse = await request(app.server)
      .get(`/cuts/${event.id}/rps/${rp.id}`)
      .set('Authorization', `Bearer ${foreignScanner.token}`)

    expect(forbiddenResponse.status).toBe(403)
  })

  async function createManager(options?: { otherLabel?: string }) {
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
        otherLabel: options?.otherLabel ?? 'Otro',
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

  async function createTicket(input: { eventId: string; rpId: string; assignmentId: string; guestType: TicketType; note?: string }) {
    const ticketId = randomUUID()
    created.tickets.add(ticketId)

    return prisma.ticket.create({
      data: {
        id: ticketId,
        eventId: input.eventId,
        rpId: input.rpId,
        assignmentId: input.assignmentId,
        guestType: input.guestType,
        note: input.note ?? null,
        qrToken: randomUUID(),
      },
    })
  }

  async function createScannedTicket(input: {
    eventId: string
    rpId: string
    assignmentId: string
    scannerId: string
    guestType: TicketType
    note?: string
  }) {
    const ticket = await createTicket(input)
    await prisma.ticket.update({ where: { id: ticket.id }, data: { status: TicketStatus.SCANNED } })

    const scanId = randomUUID()
    created.ticketScans.add(scanId)
    await prisma.ticketScan.create({
      data: {
        id: scanId,
        ticketId: ticket.id,
        scannerId: input.scannerId,
      },
    })

    return ticket
  }
})
