import type { FastifyInstance } from 'fastify';

export async function registerHealthRoute(app: FastifyInstance) {
  app.get('/health', async () => {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  });
}