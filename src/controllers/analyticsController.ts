// CONTROLLER: Analytics — Visão Geral. Regras no AnalyticsService.
import type { FastifyRequest } from 'fastify';
import { AnalyticsService } from '../services/index.js';
import { ok } from '../lib/reply.js';

export const AnalyticsController = {
  async overview(req: FastifyRequest) {
    const overview = await AnalyticsService.overview(req.session.orgId);
    return ok(overview);
  },
};
