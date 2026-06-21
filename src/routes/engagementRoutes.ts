// ROUTES: Engajamento (V1). Recebe interações e lista as respostas geradas.
import type { FastifyInstance } from 'fastify';
import { EngagementController } from '../controllers/engagementController.js';

export async function registerEngagementRoutes(app: FastifyInstance) {
  app.post('/interactions', EngagementController.receive);
  app.get('/interactions', EngagementController.list);
}
