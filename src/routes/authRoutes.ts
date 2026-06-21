// ROUTES: Auth (/me) + Health. Definição de rotas → controller.
import type { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/authController.js';
import { ok } from '../lib/reply.js';

export async function registerHealthRoutes(app: FastifyInstance) {
  app.get('/health', async () => ok({ service: 'api', ts: new Date().toISOString() }));
}

export async function registerAuthRoutes(app: FastifyInstance) {
  app.get('/me', AuthController.me);
}
