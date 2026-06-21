// ROUTES: Social (D1). Definição de rotas → controller.
import type { FastifyInstance } from 'fastify';
import { SocialController } from '../controllers/socialController.js';

export async function registerSocialRoutes(app: FastifyInstance) {
  app.get('/social-accounts', SocialController.list);
  app.post('/social-accounts/connect', SocialController.connect);
  app.post('/webhooks/ayrshare', SocialController.ayrshareWebhook);
}
