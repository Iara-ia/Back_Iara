// ROUTES: Analytics (F1). Definição de rotas → controller.
import type { FastifyInstance } from 'fastify';
import { AnalyticsController } from '../controllers/analyticsController.js';

export async function registerAnalyticsRoutes(app: FastifyInstance) {
  app.get('/analytics/overview', AnalyticsController.overview);
}
