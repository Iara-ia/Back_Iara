// CONTROLLER: Persona — recebe req/res, valida payload, chama o service, serializa via view.
import type { FastifyRequest, FastifyReply } from 'fastify';
import { CreatePersonaSchema, UpdatePersonaSchema, UploadRefsSchema } from '../lib/contracts.js';
import { PersonaService } from '../services/index.js';
import { toPersonaDTO } from '../views/serializers.js';
import { ok, err } from '../lib/reply.js';
import { denyIfReadOnly } from '../middlewares/session.js';

export const PersonaController = {
  async list(req: FastifyRequest) {
    const personas = await PersonaService.list(req.session.orgId);
    return ok(personas.map(toPersonaDTO));
  },

  // POST /personas — cria nova persona (multi-persona).
  async create(req: FastifyRequest, reply: FastifyReply) {
    if (denyIfReadOnly(req, reply)) return;
    const parsed = CreatePersonaSchema.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400);
      return err('VALIDATION', 'Payload inválido', parsed.error.flatten());
    }
    const persona = await PersonaService.create(req.session.orgId, parsed.data);
    return ok(toPersonaDTO(persona));
  },

  async getById(req: FastifyRequest) {
    const { id } = req.params as { id: string };
    const persona = await PersonaService.getById(id, req.session.orgId);
    return ok(toPersonaDTO(persona));
  },

  async update(req: FastifyRequest, reply: FastifyReply) {
    if (denyIfReadOnly(req, reply)) return;
    const { id } = req.params as { id: string };
    const parsed = UpdatePersonaSchema.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400);
      return err('VALIDATION', 'Payload inválido', parsed.error.flatten());
    }
    const updated = await PersonaService.update(id, req.session.orgId, parsed.data);
    return ok(toPersonaDTO(updated));
  },

  async addRefs(req: FastifyRequest, reply: FastifyReply) {
    if (denyIfReadOnly(req, reply)) return;
    const { id } = req.params as { id: string };
    const parsed = UploadRefsSchema.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400);
      return err('VALIDATION', 'Payload inválido', parsed.error.flatten());
    }
    const updated = await PersonaService.addRefs(id, req.session.orgId, parsed.data.urls);
    return ok(toPersonaDTO(updated));
  },
};
