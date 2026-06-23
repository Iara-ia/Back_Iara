// CONTROLLER: Analytics — Visão Geral. Regras no AnalyticsService.
import type { FastifyRequest } from 'fastify';
import { AnalyticsService } from '../services/index.js';
import { ok } from '../lib/reply.js';

export const AnalyticsController = {
  async overview(req: FastifyRequest) {
    const personaId = (req.query as { personaId?: string }).personaId;
    const overview = await AnalyticsService.overview(req.session.orgId, personaId);
    return ok(overview);
  },
};
