import request from 'supertest'
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest'
import { randomUUID } from 'crypto'
import { buildServer } from '../../server'
import { prisma } from '../../lib/prisma'
import { hashPassword } from '../../lib/password'
import { TicketStatus, TicketType, UserRole } from '@prisma/client'

describe.sequential('cuts routes', () => {
  let app: Awaited<ReturnType<typeof buildServer>>
  const created = {
    users: new Set<string>(),
    clubs: new Set<string>(),
    events: new Set<string>(),
    managerSettings: new Set<string>(),
    rpProfiles: new Set<string>(),
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
    await prisma.managerSetting.deleteMany({ where: { id: { in: Array.from(created.managerSettings) } } })
    await prisma.user.deleteMany({ where: { id: { in: Array.from(created.users) } } })

    Object.values(created).forEach((set) => set.clear())
  })

  test('GET /cuts entrega agregados por evento y rp', async () => {
    const { token, managerId } = await createManagerSession()
    const club = await createClub(managerId)
    const event = await createEvent(club.id)
    const rp = await createRp(managerId, 'RP Uno')
    const rpTwo = await createRp(managerId, 'RP Dos')
    const assignment = await assignRp(event.id, rp.id, 50)
    const assignmentTwo = await assignRp(event.id, rpTwo.id, 50)

    await createScannedTicket(event.id, rp.id, assignment.id, TicketType.GENERAL)
    await createScannedTicket(event.id, rp.id, assignment.id, TicketType.VIP)
    await createScannedTicket(event.id, rpTwo.id, assignmentTwo.id, TicketType.OTHER)

    const response = await request(app.server).get('/cuts').set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.events).toHaveLength(1)
    const summary = response.body.events[0]
    expect(summary.totalGeneral).toBe(1)
    expect(summary.totalVip).toBe(1)
    expect(summary.totalOther).toBe(1)
    expect(summary.rps).toHaveLength(2)
    const rpSummary = summary.rps.find((rpRow: any) => rpRow.rpName === 'RP Uno')
    expect(rpSummary.total).toBe(2)
  })

  test('GET /cuts/:eventId/rps/:rpId devuelve detalle ordenado', async () => {
    const { token, managerId } = await createManagerSession()
    const club = await createClub(managerId)
    const event = await createEvent(club.id)
    const rp = await createRp(managerId, 'RP Cortes')
    const assignment = await assignRp(event.id, rp.id, null)

    const ticket = await createScannedTicket(event.id, rp.id, assignment.id, TicketType.OTHER)

    const response = await request(app.server)
      .get(`/cuts/${event.id}/rps/${rp.id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.event.id).toBe(event.id)
    expect(response.body.rp.id).toBe(rp.id)
    expect(response.body.scans).toHaveLength(1)
    expect(response.body.scans[0].ticketId).toBe(ticket.id)
    expect(response.body.scans[0].displayLabel).toBe('Etiqueta Other')
  })

  async function createManagerSession() {
    const managerId = randomUUID()
    created.users.add(managerId)
    await prisma.user.create({
      data: {
        id: managerId,
        name: 'Manager Cuts',
        username: `manager_${managerId.slice(0, 6)}`,
        password: await hashPassword('secret-123'),
        role: UserRole.MANAGER,
      },
    })

    const settingId = randomUUID()
    created.managerSettings.add(settingId)
    await prisma.managerSetting.create({
      data: {
        id: settingId,
        managerId,
        otherLabel: 'Etiqueta Other',
      },
    })

    const loginResponse = await request(app.server).post('/auth/login').send({
      username: `manager_${managerId.slice(0, 6)}`,
      password: 'secret-123',
    })

    expect(loginResponse.status).toBe(200)
    return { token: loginResponse.body.token as string, managerId }
  }

  async function createClub(managerId: string) {
    const clubId = randomUUID()
    created.clubs.add(clubId)
    await prisma.club.create({
      data: {
        id: clubId,
        managerId,
        name: 'Club Cortes',
        capacity: 300,
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
        name: 'Evento Cortes',
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 7200000),
      },
    })

    return { id: eventId }
  }

  async function createRp(managerId: string, name: string) {
    const userId = randomUUID()
    created.users.add(userId)
    await prisma.user.create({
      data: {
        id: userId,
        name,
        username: `rp_${userId.slice(0, 6)}`,
        password: await hashPassword('secret-123'),
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

  async function assignRp(eventId: string, rpId: string, limitAccesses: number | null) {
    const assignmentId = randomUUID()
    created.eventRps.add(assignmentId)
    await prisma.eventRp.create({
      data: {
        id: assignmentId,
        eventId,
        rpId,
        limitAccesses,
      },
    })

    return { id: assignmentId }
  }

  async function createScannedTicket(eventId: string, rpId: string, assignmentId: string, guestType: TicketType) {
    const ticketId = randomUUID()
    created.tickets.add(ticketId)
    const ticket = await prisma.ticket.create({
      data: {
        id: ticketId,
        eventId,
        rpId,
        assignmentId,
        guestType,
        note: 'Nota de auditoria',
        qrToken: randomUUID(),
        status: TicketStatus.SCANNED,
      },
    })

    const scanId = randomUUID()
    created.ticketScans.add(scanId)
    await prisma.ticketScan.create({
      data: {
        id: scanId,
        ticketId,
        scannedAt: new Date(),
      },
    })

    return ticket
  }
})
