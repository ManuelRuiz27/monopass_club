process.env.PRISMA_CLIENT_ENGINE_TYPE = process.env.PRISMA_CLIENT_ENGINE_TYPE || 'library'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient({ log: [] })
console.log('scannerConfirmRequest' in prisma)
prisma.$disconnect()
