// CONTROLLER: Conteúdo — valida payload, delega ao ContentService, serializa via view.
// As regras (gates, transições, RBAC de aprovar) vivem no service; aqui é só I/O HTTP.
import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  GenerateContentSchema,
  ListContentQuerySchema,
  PatchContentSchema,
  ScheduleContentSchema,
  SetAffiliateLinksSchema,
} from '../lib/contracts.js';
import { ContentService } from '../services/index.js';
import { toContentItemDTO } from '../views/serializers.js';
import { ok, err } from '../lib/reply.js';
import { denyIfReadOnly } from '../middlewares/session.js';

export const ContentController = {
  async generate(req: FastifyRequest, reply: FastifyReply) {
    if (denyIfReadOnly(req, reply)) return;
    const parsed = GenerateContentSchema.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400);
      return err('VALIDATION', 'Payload inválido', parsed.error.flatten());
    }
    const items = await ContentService.generate(req.session.orgId, parsed.data);
    req.log.info({ created: items.length }, '[generate] itens criados e enfileirados');
    return ok({ created: items.length, items: items.map(toContentItemDTO) });
  },

  async list(req: FastifyRequest, reply: FastifyReply) {
    const parsed = ListContentQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      reply.code(400);
      return err('VALIDATION', 'Query inválida', parsed.error.flatten());
    }
    const items = await ContentService.list(req.session.orgId, parsed.data);
    return ok(items.map(toContentItemDTO));
  },

  async patch(req: FastifyRequest, reply: FastifyReply) {
    if (denyIfReadOnly(req, reply)) return;
    const { id } = req.params as { id: string };
    const parsed = PatchContentSchema.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400);
      return err('VALIDATION', 'Payload inválido', parsed.error.flatten());
    }
    const updated = await ContentService.patch(
      id,
      req.session.orgId,
      req.session.role,
      req.session.userId,
      parsed.data,
    );
    return ok(toContentItemDTO(updated));
  },

  // POST /content/:id/schedule — Sprint 3 (stub mantido).
  async schedule(req: FastifyRequest, reply: FastifyReply) {
    const parsed = ScheduleContentSchema.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400);
      return err('VALIDATION', 'Payload inválido', parsed.error.flatten());
    }
    reply.code(501);
    return err('NOT_IMPLEMENTED', 'POST /content/:id/schedule — Sprint 3');
  },

  // POST /content/:id/affiliate-links — Sprint 3 (stub mantido).
  async affiliateLinks(req: FastifyRequest, reply: FastifyReply) {
    const parsed = SetAffiliateLinksSchema.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400);
      return err('VALIDATION', 'Payload inválido', parsed.error.flatten());
    }
    reply.code(501);
    return err('NOT_IMPLEMENTED', 'POST /content/:id/affiliate-links — Sprint 3');
  },
};
