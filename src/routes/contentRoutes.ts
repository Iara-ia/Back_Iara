// ROUTES: Conteúdo (Épico B + kanban). Definição de rotas → controller.
import type { FastifyInstance } from 'fastify';
import { ContentController } from '../controllers/contentController.js';

export async function registerContentRoutes(app: FastifyInstance) {
  app.post('/content/generate', ContentController.generate);
  app.post('/content/autopilot', ContentController.autopilot);
  app.get('/content', ContentController.list);
  app.patch('/content/:id', ContentController.patch);
  app.post('/content/:id/schedule', ContentController.schedule);
  app.post('/content/:id/affiliate-links', ContentController.affiliateLinks);
}
