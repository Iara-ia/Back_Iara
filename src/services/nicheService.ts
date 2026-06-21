// SERVICE: Nichos — expõe o catálogo (o "leque") e normaliza a seleção da persona.
// A lógica/dados puros vivem em lib/niches.ts; aqui fica a camada de negócio (MVC).
import { listNicheCatalog, normalizeNiches } from '../lib/niches.js';

export const NicheService = {
  // GET /niches — catálogo completo agrupado por categoria.
  catalog() {
    return listNicheCatalog();
  },

  // Normaliza nichos escolhidos pela persona (slugs do catálogo + custom).
  normalize(niches: string[]) {
    return normalizeNiches(niches);
  },
};
