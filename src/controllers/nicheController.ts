// CONTROLLER: Nichos — devolve o catálogo (leque) para o front montar a seleção.
import { NicheService } from '../services/index.js';
import { ok } from '../lib/reply.js';

export const NicheController = {
  async list() {
    return ok(NicheService.catalog());
  },
};
