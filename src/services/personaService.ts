// SERVICE: regras de negócio de Persona (A3). Escopado por orgId.
// Erros de domínio sobem como ServiceError (status + code) para o controller traduzir.
import { PersonaModel } from '../models/personaModel.js';
import { ServiceError } from './errors.js';
import type { UpdatePersonaInput } from '../lib/contracts.js';

export const PersonaService = {
  list(orgId: string) {
    return PersonaModel.listByOrg(orgId);
  },

  async getById(id: string, orgId: string) {
    const persona = await PersonaModel.findByIdInOrg(id, orgId);
    if (!persona) throw new ServiceError(404, 'NOT_FOUND', 'Persona não encontrada nesta org.');
    return persona;
  },

  async update(id: string, orgId: string, d: UpdatePersonaInput) {
    const existing = await PersonaModel.findByIdInOrg(id, orgId);
    if (!existing) throw new ServiceError(404, 'NOT_FOUND', 'Persona não encontrada nesta org.');

    return PersonaModel.update(id, {
      ...(d.name !== undefined ? { name: d.name } : {}),
      ...(d.bio !== undefined ? { bio: d.bio } : {}),
      ...(d.niches !== undefined ? { niches: d.niches } : {}),
      ...(d.language !== undefined ? { language: d.language } : {}),
      ...(d.visualProfile !== undefined ? { visualProfile: d.visualProfile as object } : {}),
      ...(d.personality !== undefined ? { personality: d.personality as object } : {}),
      // aiDisclosure é obrigatório por compliance: ignora tentativa de desligar.
      ...(d.aiDisclosure === true ? { aiDisclosure: true } : {}),
    });
  },

  // Upload de refs faciais — no MVP recebemos URLs já hospedadas. Append às refs existentes.
  async addRefs(id: string, orgId: string, urls: string[]) {
    const persona = await PersonaModel.findByIdInOrg(id, orgId);
    if (!persona) throw new ServiceError(404, 'NOT_FOUND', 'Persona não encontrada nesta org.');

    const visual = (persona.visualProfile ?? { loraId: null, faceRefs: [], paleta: [] }) as {
      loraId: string | null;
      faceRefs: { url: string; approved: boolean }[];
      paleta: string[];
    };
    const newRefs = urls.map((url) => ({ url, approved: true })); // MVP: refs aprovadas ao subir
    visual.faceRefs = [...(visual.faceRefs ?? []), ...newRefs];

    return PersonaModel.update(id, { visualProfile: visual as object });
  },
};
