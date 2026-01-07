
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const ticket = await prisma.ticket.findFirst({
        where: { note: 'Invitado demo' }
    })
    console.log('Test Token:', ticket?.qrToken)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
