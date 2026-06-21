// CONTROLLER: Engajamento — recebe interação (comentário/DM), delega ao service, serializa.
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { Interaction } from '@prisma/client';
import { ReceiveInteractionSchema } from '../lib/contracts.js';
import { EngagementService } from '../services/index.js';
import { ok, err } from '../lib/reply.js';
import { denyIfReadOnly } from '../middlewares/session.js';

function toDTO(i: Interaction) {
  return {
    id: i.id,
    personaId: i.personaId,
    platform: i.platform,
    externalId: i.externalId,
    kind: i.kind,
    inboundText: i.inboundText,
    replyDraft: i.replyDraft,
    status: i.status,
    createdAt: i.createdAt.toISOString(),
  };
}

export const EngagementController = {
  // POST /interactions — recebe um comentário/DM (no real: webhook das redes) e auto-responde.
  async receive(req: FastifyRequest, reply: FastifyReply) {
    if (denyIfReadOnly(req, reply)) return;
    const parsed = ReceiveInteractionSchema.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400);
      return err('VALIDATION', 'Payload inválido', parsed.error.flatten());
    }
    const { personaId, platform, externalId, text } = parsed.data;
    const i = await EngagementService.receive(req.session.orgId, personaId, {
      platform,
      externalId,
      text,
    });
    return ok(toDTO(i));
  },

  async list(req: FastifyRequest) {
    const items = await EngagementService.list(req.session.orgId);
    return ok(items.map(toDTO));
  },
};
