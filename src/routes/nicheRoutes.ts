// ROUTES: Nichos. Catálogo configurável (leque) que a persona pode aderir.
import type { FastifyInstance } from 'fastify';
import { NicheController } from '../controllers/nicheController.js';

export async function registerNicheRoutes(app: FastifyInstance) {
  app.get('/niches', NicheController.list);
}
