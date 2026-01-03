import request from 'supertest'
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest'
import { randomUUID } from 'crypto'
import { buildServer } from '../../server'
import { prisma } from '../../lib/prisma'
import { hashPassword } from '../../lib/password'
import { UserRole } from '@prisma/client'

describe.sequential('Manager contract routes', () => {
  let app: Awaited<ReturnType<typeof buildServer>>
  const createdUserIds = new Set<string>()

  beforeAll(async () => {
    app = await buildServer()
    await app.ready()
  })

  afterAll(async () => {
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
    const username = `manager_${id.slice(0, 8)}`
    const rawPassword = `Pass-${id.slice(0, 5)}`

    await prisma.user.create({
      data: {
        id,
        name: `Manager ${id.slice(0, 4)}`,
        username,
        password: await hashPassword(rawPassword),
        role: UserRole.MANAGER,
      },
    })

    const loginResponse = await request(app.server).post('/auth/login').send({
      username,
      password: rawPassword,
    })

    expect(loginResponse.status).toBe(200)

    createdUserIds.add(id)
    return { managerId: id, token: loginResponse.body.token as string }
  }

  async function createClub(managerId: string) {
    return prisma.club.create({
      data: {
        id: randomUUID(),
        managerId,
        name: `Club ${randomUUID().slice(0, 4)}`,
        capacity: 200,
      },
    })
  }

  async function createEvent(clubId: string) {
    return prisma.event.create({
      data: {
        id: randomUUID(),
        clubId,
        name: `Event ${randomUUID().slice(0, 4)}`,
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    })
  }

  async function createRp(managerId: string) {
    const userId = randomUUID()
    const rpProfileId = randomUUID()

    await prisma.user.create({
      data: {
        id: userId,
        name: 'RP Contract',
        username: `rp_${userId.slice(0, 6)}`,
        password: await hashPassword('Secret123'),
        role: UserRole.RP,
      },
    })

    createdUserIds.add(userId)

    return prisma.rpProfile.create({
      data: {
        id: rpProfileId,
        managerId,
        userId,
      },
      include: { user: true },
    })
  }

  test('GET /clubs devuelve solo los clubes del manager autenticado', async () => {
    const [managerA, managerB] = await Promise.all([createManager(), createManager()])

    const [clubForA] = await Promise.all([createClub(managerA.managerId), createClub(managerB.managerId)])

    const response = await request(app.server)
      .get('/clubs')
      .set('Authorization', `Bearer ${managerA.token}`)

    expect(response.status).toBe(200)
    expect(Array.isArray(response.body)).toBe(true)
    expect(response.body).toHaveLength(1)
    expect(response.body[0].id).toBe(clubForA.id)
    expect(response.body[0].managerId).toBe(managerA.managerId)
  })

  test('POST /events valida pertenencia del club al manager', async () => {
    const [managerA, managerB] = await Promise.all([createManager(), createManager()])
    const foreignClub = await createClub(managerB.managerId)

    const response = await request(app.server)
      .post('/events')
      .set('Authorization', `Bearer ${managerA.token}`)
      .send({
        clubId: foreignClub.id,
        name: 'Evento ajeno',
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 3600000).toISOString(),
      })

    expect(response.status).toBe(403)
    expect(response.body?.message).toMatch(/No puedes acceder a este club/i)
  })

  test('POST /events/:eventId/rps responde 409 al duplicar asignacion', async () => {
    const manager = await createManager()
    const club = await createClub(manager.managerId)
    const event = await createEvent(club.id)
    const rp = await createRp(manager.managerId)

    const firstAssignment = await request(app.server)
      .post(`/events/${event.id}/rps`)
      .set('Authorization', `Bearer ${manager.token}`)
      .send({
        rpId: rp.id,
        limitAccesses: 10,
      })

    expect(firstAssignment.status).toBe(200)
    expect(firstAssignment.body.rp.id).toBe(rp.id)
    expect(firstAssignment.body.limitAccesses).toBe(10)

    const duplicateAssignment = await request(app.server)
      .post(`/events/${event.id}/rps`)
      .set('Authorization', `Bearer ${manager.token}`)
      .send({
        rpId: rp.id,
        limitAccesses: 20,
      })

    expect(duplicateAssignment.status).toBe(409)
    expect(duplicateAssignment.body?.message).toMatch(/ya esta asignado/i)
  })
})
