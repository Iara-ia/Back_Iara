// CONTROLLER: Billing — plano atual + catálogo, e checkout (mock ativa na hora; stripe → URL).
import type { FastifyRequest, FastifyReply } from 'fastify';
import { CheckoutSchema } from '../lib/contracts.js';
import { BillingService } from '../services/index.js';
import { ok, err } from '../lib/reply.js';
import { denyIfReadOnly } from '../middlewares/session.js';

export const BillingController = {
  async get(req: FastifyRequest) {
    return ok(await BillingService.getBilling(req.session.orgId));
  },

  async checkout(req: FastifyRequest, reply: FastifyReply) {
    if (denyIfReadOnly(req, reply)) return;
    const parsed = CheckoutSchema.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400);
      return err('VALIDATION', 'Payload inválido', parsed.error.flatten());
    }
    const out = await BillingService.createCheckout(req.session.orgId, parsed.data.plan);
    return ok(out);
  },
};
