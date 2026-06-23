// SERVICE: regras de negócio de Social (D1) — conectar IG/TikTok + persistir vínculo.
// O token do perfil é criptografado antes de salvar (crypto). Escopado por orgId.
import { SocialModel } from '../models/socialModel.js';
import { PersonaModel } from '../models/personaModel.js';
import { createProviders } from '../providers/index.js';
import { encrypt } from '../lib/crypto.js';
import { ServiceError } from './errors.js';
import type { ConnectSocialInput } from '../lib/contracts.js';

const providers = createProviders();

export const SocialService = {
  list(orgId: string) {
    return SocialModel.listByOrg(orgId);
  },

  async connect(orgId: string, input: ConnectSocialInput) {
    const { personaId, platform, handle } = input;

    const persona = await PersonaModel.findByIdInOrg(personaId, orgId);
    if (!persona) throw new ServiceError(404, 'NOT_FOUND', 'Persona não encontrada nesta org.');

    // Fluxo de conexão (mock|ayrshare por env). Mock devolve um profileKey determinístico.
    const conn = await providers.distribution.connect(platform, handle);
    const tokenEnc = encrypt(conn.data.profileKey);

    // Idempotência: 1 conta por (persona, plataforma). Reconecta atualizando o token.
    const existing = await SocialModel.findInOrg(personaId, platform, orgId);
    return existing
      ? SocialModel.update(existing.id, { handle, tokenEnc, status: conn.data.status })
      : SocialModel.create({ personaId, platform, handle, tokenEnc, status: conn.data.status });
  },

  // Desconectar/revogar: apaga o vínculo (e o token). No real, também revogaria o token na rede.
  async disconnect(orgId: string, id: string) {
    const acc = await SocialModel.findByIdInOrg(id, orgId);
    if (!acc) throw new ServiceError(404, 'NOT_FOUND', 'Conta não encontrada nesta org.');
    await SocialModel.delete(id);
    return { id };
  },
};
