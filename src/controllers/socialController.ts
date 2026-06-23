// CONTROLLER: Social — conectar contas + listar. Regras no SocialService.
import type { FastifyRequest, FastifyReply } from 'fastify';
import { ConnectSocialSchema } from '../lib/contracts.js';
import { SocialService } from '../services/index.js';
import { toSocialAccountDTO } from '../views/serializers.js';
import { ok, err } from '../lib/reply.js';
import { denyIfReadOnly } from '../middlewares/session.js';

export const SocialController = {
  async list(req: FastifyRequest) {
    const accounts = await SocialService.list(req.session.orgId);
    return ok(accounts.map(toSocialAccountDTO));
  },

  async connect(req: FastifyRequest, reply: FastifyReply) {
    if (denyIfReadOnly(req, reply)) return;
    const parsed = ConnectSocialSchema.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400);
      return err('VALIDATION', 'Payload inválido', parsed.error.flatten());
    }
    const account = await SocialService.connect(req.session.orgId, parsed.data);
    return ok(toSocialAccountDTO(account));
  },

  async disconnect(req: FastifyRequest, reply: FastifyReply) {
    if (denyIfReadOnly(req, reply)) return;
    const { id } = req.params as { id: string };
    const out = await SocialService.disconnect(req.session.orgId, id);
    return ok(out);
  },

  // Webhook do Ayrshare — Sprint 3 (mantido).
  async ayrshareWebhook(_req: FastifyRequest, reply: FastifyReply) {
    reply.code(202);
    return ok({ received: true });
  },
};
