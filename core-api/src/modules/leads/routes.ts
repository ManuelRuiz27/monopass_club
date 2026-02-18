import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'

const leadBodySchema = z.object({
    name: z.string().min(2),
    role: z.enum(['Organizador', 'Manager', 'Productora']),
    city: z.string().min(2),
    venues: z.number().int().min(1),
    phone: z.string().min(8),
    email: z.string().email(),
    instagram: z.string().optional(),
})

export async function registerLeadRoutes(app: FastifyInstance) {
    app.post('/api/leads', async (request, reply) => {
        const body = leadBodySchema.parse(request.body)

        await prisma.lead.create({
            data: {
                ...body,
                instagram: body.instagram ?? null,
            },
        })

        reply.status(201).send({
            message: 'Solicitud recibida. Nuestro equipo responderá en 24–48h.',
        })
    })
}
