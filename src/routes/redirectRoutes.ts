// ROUTES: redirect público de afiliado (tracking de cliques). GET /r/:itemId/:idx → conta
// o clique e 302 para a URL de destino. Público (sem auth) — a sessão pula o prefixo /r/.
import type { FastifyInstance } from 'fastify';
import { ContentService } from '../services/index.js';

export async function registerRedirectRoutes(app: FastifyInstance) {
  app.get('/r/:itemId/:idx', async (req, reply) => {
    const { itemId, idx } = req.params as { itemId: string; idx: string };
    const url = await ContentService.recordAffiliateClick(itemId, Number(idx));
    if (!url) {
      reply.code(404);
      return reply.send('Link não encontrado.');
    }
    reply.code(302);
    reply.header('location', url);
    return reply.send();
  });
}
