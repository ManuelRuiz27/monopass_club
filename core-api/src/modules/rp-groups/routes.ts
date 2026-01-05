import { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma'
import { z } from 'zod'
import { randomUUID } from 'crypto'

const createGroupSchema = z.object({
    name: z.string().min(1),
    memberIds: z.array(z.string().uuid()),
})

const updateGroupSchema = z.object({
    name: z.string().min(1).optional(),
    memberIds: z.array(z.string().uuid()).optional(),
})

const paramsSchema = z.object({
    groupId: z.string().uuid(),
})

export async function registerRpGroupRoutes(app: FastifyInstance) {
    // LIST
    app.get('/rp-groups', { preHandler: [app.authenticate, app.authorizeManager] }, async (request) => {
        const managerId = request.user!.userId
        return prisma.rpGroup.findMany({
            where: { managerId },
            include: {
                members: {
                    select: { id: true, user: { select: { name: true } } }
                }
            },
            orderBy: { createdAt: 'desc' },
        })
    })

    // GET ONE
    app.get(
        '/rp-groups/:groupId',
        { preHandler: [app.authenticate, app.authorizeManager] },
        async (request) => {
            const managerId = request.user!.userId
            const params = paramsSchema.parse(request.params)

            const group = await prisma.rpGroup.findUnique({
                where: { id: params.groupId },
                include: { members: { include: { user: true } } },
            })

            if (!group || group.managerId !== managerId) {
                throw app.httpErrors.notFound('Grupo no encontrado')
            }

            return group
        },
    )

    // CREATE
    app.post('/rp-groups', { preHandler: [app.authenticate, app.authorizeManager] }, async (request, reply) => {
        const managerId = request.user!.userId
        const body = createGroupSchema.parse(request.body)

        // Verify ownership of RPs
        if (body.memberIds.length > 0) {
            const count = await prisma.rpProfile.count({
                where: {
                    id: { in: body.memberIds },
                    managerId,
                },
            })
            if (count !== body.memberIds.length) {
                throw app.httpErrors.badRequest('Uno o más RPs no pertenecen a tu equipo')
            }
        }

        const group = await prisma.rpGroup.create({
            data: {
                id: randomUUID(),
                managerId,
                name: body.name,
                members: {
                    connect: body.memberIds.map((id) => ({ id })),
                },
            },
            include: { members: true },
        })

        reply.code(201)
        return group
    })

    // UPDATE
    app.put(
        '/rp-groups/:groupId',
        { preHandler: [app.authenticate, app.authorizeManager] },
        async (request) => {
            const managerId = request.user!.userId
            const params = paramsSchema.parse(request.params)
            const body = updateGroupSchema.parse(request.body)

            const existing = await prisma.rpGroup.findUnique({ where: { id: params.groupId } })
            if (!existing || existing.managerId !== managerId) {
                throw app.httpErrors.notFound('Grupo no encontrado')
            }

            // If updating members, verify ownership
            if (body.memberIds) {
                if (body.memberIds.length > 0) {
                    const count = await prisma.rpProfile.count({
                        where: {
                            id: { in: body.memberIds },
                            managerId,
                        },
                    })
                    if (count !== body.memberIds.length) {
                        throw app.httpErrors.badRequest('Uno o más RPs no pertenecen a tu equipo')
                    }
                }
            }

            const updated = await prisma.rpGroup.update({
                where: { id: params.groupId },
                data: {
                    ...(body.name !== undefined ? { name: body.name } : {}),
                    ...(body.memberIds !== undefined
                        ? { members: { set: body.memberIds.map((id) => ({ id })) } }
                        : {}),
                },
                include: { members: true },
            })

            return updated
        },
    )

    // DELETE
    app.delete(
        '/rp-groups/:groupId',
        { preHandler: [app.authenticate, app.authorizeManager] },
        async (request, reply) => {
            const managerId = request.user!.userId
            const params = paramsSchema.parse(request.params)

            const existing = await prisma.rpGroup.findUnique({ where: { id: params.groupId } })
            if (!existing || existing.managerId !== managerId) {
                throw app.httpErrors.notFound('Grupo no encontrado')
            }

            await prisma.rpGroup.delete({ where: { id: params.groupId } })
            reply.code(204).send()
        },
    )
}
