import '@fastify/jwt'
import { FastifyReply, FastifyRequest } from 'fastify'
import { UserRole } from '@prisma/client'

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
    authorizeScanner(request: FastifyRequest, reply: FastifyReply): Promise<void>
  }
}
