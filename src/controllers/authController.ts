// CONTROLLER: Auth — /me devolve a sessão atual (userId, orgId, role).
import type { FastifyRequest } from 'fastify';
import type { MeResponse } from '../lib/contracts.js';
import { ok } from '../lib/reply.js';

export const AuthController = {
  async me(req: FastifyRequest) {
    const s = req.session;
    const me: MeResponse = {
      userId: s.userId,
      orgId: s.orgId,
      orgName: s.orgName,
      role: s.role,
      email: s.email,
      name: s.name,
    };
    return ok(me);
  },
};
