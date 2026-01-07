import 'dotenv/config'
import { PrismaClient, UserRole, TicketType } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { randomUUID } from 'crypto'
import { hash } from 'bcryptjs'

const DEFAULT_PASSWORD = 'changeme123'

export async function seedDatabase(prismaInstance?: PrismaClient) {
    let prisma: PrismaClient
    let pool: Pool | undefined

    if (prismaInstance) {
        prisma = prismaInstance
    } else {
        // Standalone mode setup
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL is not defined')
        }
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
        })
        const adapter = new PrismaPg(pool)
        prisma = new PrismaClient({ adapter })
    }

    try {
        await prisma.user.deleteMany()

        const managerId = randomUUID()
        const rpUserId = randomUUID()
        const scannerUserId = randomUUID()

        const passwordHash = await hash(DEFAULT_PASSWORD, 10)

        const manager = await prisma.user.create({
            data: {
                id: managerId,
                name: 'Demo Manager',
                username: 'manager.demo',
                password: passwordHash,
                role: UserRole.MANAGER,
            },
        })

        await prisma.managerSetting.create({
            data: {
                id: randomUUID(),
                managerId: manager.id,
                otherLabel: 'Otro',
            },
        })

        const club = await prisma.club.create({
            data: {
                id: randomUUID(),
                managerId: manager.id,
                name: 'Club Mono',
                capacity: 500,
            },
        })

        const event = await prisma.event.create({
            data: {
                id: randomUUID(),
                clubId: club.id,
                name: 'Opening Night',
                startsAt: new Date(Date.now() + 86400000),
                endsAt: new Date(Date.now() + 90000000),
            },
        })

        const rpUser = await prisma.user.create({
            data: {
                id: rpUserId,
                name: 'Demo RP',
                username: 'rp.demo',
                password: passwordHash,
                role: UserRole.RP,
            },
        })

        const rpProfile = await prisma.rpProfile.create({
            data: {
                id: randomUUID(),
                managerId: manager.id,
                userId: rpUser.id,
            },
        })

        const scannerUser = await prisma.user.create({
            data: {
                id: scannerUserId,
                name: 'Demo Scanner',
                username: 'scanner.demo',
                password: passwordHash,
                role: UserRole.SCANNER,
            },
        })

        const scannerProfile = await prisma.scannerProfile.create({
            data: {
                id: randomUUID(),
                managerId: manager.id,
                userId: scannerUser.id,
            },
        })

        const assignment = await prisma.eventRp.create({
            data: {
                id: randomUUID(),
                eventId: event.id,
                rpId: rpProfile.id,
                limitAccesses: 50,
            },
        })

        const ticket = await prisma.ticket.create({
            data: {
                id: randomUUID(),
                eventId: event.id,
                rpId: rpProfile.id,
                assignmentId: assignment.id,
                guestType: TicketType.GENERAL,
                qrToken: randomUUID(),
                note: 'Invitado demo',
            },
        })

        await prisma.ticketScan
            .create({
                data: {
                    id: randomUUID(),
                    ticketId: ticket.id,
                    scannerId: scannerProfile.id,
                },
            })
            .catch(() => undefined)

        console.log('Seed data generated with default password:', DEFAULT_PASSWORD)

    } finally {
        if (!prismaInstance && pool) {
            await prisma.$disconnect()
            await pool.end()
        }
    }
}
