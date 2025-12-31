import 'fastify'
import '@fastify/jwt'
import { UserRole } from '@prisma/client'
import { FastifyReply, FastifyRequest } from 'fastify'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      userId: string
      role: UserRole
    }
    user: {
      userId: string
      role: UserRole
    }
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>
    authorizeManager(request: FastifyRequest, reply: FastifyReply): Promise<void>
    authorizeRp(request: FastifyRequest, reply: FastifyReply): Promise<void>
  }
}
