import 'dotenv/config'
import {
    ClubSubscriptionStatus,
    InvoiceStatus,
    InvoiceType,
    LedgerEntryType,
    PaymentMethod,
    PaymentProvider,
    PaymentStatus,
    PrismaClient,
    SubscriptionBillingPeriod,
    SubscriptionPlanStatus,
    UserRole,
    TicketType,
} from '@prisma/client'
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
        await prisma.directorAuditLog.deleteMany()
        await prisma.financePreset.deleteMany()
        await prisma.ledgerEntry.deleteMany()
        await prisma.payment.deleteMany()
        await prisma.invoice.deleteMany()
        await prisma.subscription.deleteMany()
        await prisma.promotion.deleteMany()
        await prisma.subscriptionPlan.deleteMany()
        await prisma.ticketScan.deleteMany()
        await prisma.ticket.deleteMany()
        await prisma.eventRp.deleteMany()
        await prisma.event.deleteMany()
        await prisma.club.deleteMany()
        await prisma.rpProfile.deleteMany()
        await prisma.scannerProfile.deleteMany()
        await prisma.managerSetting.deleteMany()
        await prisma.user.deleteMany()

        const directorId = randomUUID()
        const managerId = randomUUID()
        const rpUserId = randomUUID()
        const scannerUserId = randomUUID()

        const passwordHash = await hash(DEFAULT_PASSWORD, 10)

        await prisma.user.create({
            data: {
                id: directorId,
                name: 'Demo Director',
                username: 'director.demo',
                password: passwordHash,
                role: UserRole.DIRECTOR,
            },
        })

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

        const monthlyPlan = await prisma.subscriptionPlan.create({
            data: {
                id: randomUUID(),
                name: 'Director Pro MX',
                description: 'Plan demo para monetizacion',
                billingPeriod: SubscriptionBillingPeriod.monthly,
                priceMxn: 149900,
                currency: 'MXN',
                includedEventsPerMonth: 8,
                entitlements: { events_per_month: 8, rps: 20, scanners: 10 },
                overagePricePerEventMxn: 19900,
                status: SubscriptionPlanStatus.active,
            },
        })

        const subscription = await prisma.subscription.create({
            data: {
                id: randomUUID(),
                clubId: club.id,
                planId: monthlyPlan.id,
                status: ClubSubscriptionStatus.active,
                startAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                currentPeriodStart: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                currentPeriodEnd: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
                cancelAtPeriodEnd: false,
                metadata: { source: 'seed' },
                overrides: { hosts_limit: 6 },
            },
        })

        const invoice = await prisma.invoice.create({
            data: {
                id: randomUUID(),
                clubId: club.id,
                subscriptionId: subscription.id,
                type: InvoiceType.subscription,
                subtotalMxn: 149900,
                taxMxn: 23984,
                totalMxn: 173884,
                status: InvoiceStatus.paid,
                issuedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                dueAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                items: [{ description: 'Suscripcion mensual Director Pro MX', qty: 1, unit_price_mxn: 149900, line_total_mxn: 149900 }],
                notes: 'Factura seed',
            },
        })

        const payment = await prisma.payment.create({
            data: {
                id: randomUUID(),
                invoiceId: invoice.id,
                clubId: club.id,
                method: PaymentMethod.transfer,
                provider: PaymentProvider.manual,
                providerRef: `seed-${invoice.id.slice(0, 8)}`,
                amountMxn: invoice.totalMxn,
                feeMxn: 0,
                netMxn: invoice.totalMxn,
                status: PaymentStatus.succeeded,
            },
        })

        await prisma.ledgerEntry.create({
            data: {
                id: randomUUID(),
                clubId: club.id,
                type: LedgerEntryType.revenue,
                category: 'invoice_payment',
                amountMxn: payment.amountMxn,
                referenceType: 'payment',
                referenceId: payment.id,
                occurredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            },
        })

        await prisma.financePreset.create({
            data: {
                id: randomUUID(),
                directorUserId: directorId,
                name: 'MX Default',
                vatRate: 0.16,
                isrMode: 'simple_rate',
                isrRate: 0.1,
                defaultExpenseCategories: ['marketing', 'staff', 'infra'],
                notes: 'Preset demo',
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
