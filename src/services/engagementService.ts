// ============================================================
// SERVICE (V1) — Engajamento. Recebe comentário/DM, classifica a intenção e auto-responde
// no tom da persona (via LLM provider mock|claude), passando pelo gate de segurança.
//   - spam / parceria  → ROUTED (não auto-responde: descarte / CRM humano)
//   - dúvida/elogio/e_ia → gera resposta + gate → ANSWERED (mock: resposta "postada")
//   - resposta bloqueada pelo gate → ROUTED (humano decide)
// ============================================================
import { InteractionModel } from '../models/interactionModel.js';
import { createProviders } from '../providers/index.js';
import { ServiceError } from './errors.js';
import type { SocialPlatform } from '../lib/enums.js';

const providers = createProviders();

// Classificador de intenção (heurístico, determinístico). Real: pode virar um classificador LLM.
function classify(text: string): string {
  const t = text.toLowerCase();
  if (/parceria|publi|colab|contato|assessoria|imprensa|or[çc]amento|fechar com/.test(t))
    return 'parceria';
  if (/https?:\/\/|clique aqui|ganhe|promo[çc]|frete gr[áa]tis|whats\b/.test(t)) return 'spam';
  if (/\b(ia|intelig[êe]ncia artificial|rob[ôo]|[ée] real|de verdade|gerad[ao])\b/.test(t))
    return 'e_ia';
  if (/amei|linda|maravilhos|perfeit|incr[íi]vel|parab[ée]ns|ador[oei]|top\b|que chique/.test(t))
    return 'elogio';
  return 'duvida';
}

export const EngagementService = {
  async receive(
    orgId: string,
    personaId: string,
    input: { platform: SocialPlatform; externalId: string; text: string },
  ) {
    const persona = await InteractionModel.personaInOrg(personaId, orgId);
    if (!persona) throw new ServiceError(404, 'NOT_FOUND', 'Persona não encontrada nesta org.');

    const kind = classify(input.text);

    // Spam e parceria não recebem auto-resposta: roteados (descarte / notificação humana/CRM).
    if (kind === 'spam' || kind === 'parceria') {
      return InteractionModel.create({
        personaId,
        platform: input.platform,
        externalId: input.externalId,
        kind,
        inboundText: input.text,
        status: 'ROUTED',
      });
    }

    const personality = (persona.personality ?? {}) as { systemPrompt?: string };
    const ctx =
      kind === 'e_ia'
        ? 'comentário sobre você ser uma IA — assuma com orgulho e transparência'
        : kind === 'elogio'
          ? 'elogio recebido'
          : 'comentário/dúvida';
    const reply = await providers.llm.generateText({
      system: personality.systemPrompt ?? 'Você é a Isabella Souza, influenciadora virtual brasileira.',
      prompt: `Responda de forma curta, calorosa e no seu tom a este ${ctx}: "${input.text}". Máximo 2 frases, sem hashtags.`,
      model: 'volume',
      maxTokens: 200,
    });

    // Gate de segurança na resposta gerada (mesmo motor Conar/safety do conteúdo).
    const safety = await providers.safety.check({ text: reply.data, hasAffiliateLink: false });
    const blocked = safety.data.verdict === 'block';

    return InteractionModel.create({
      personaId,
      platform: input.platform,
      externalId: input.externalId,
      kind,
      inboundText: input.text,
      replyDraft: blocked ? null : reply.data,
      // Mock: 'ANSWERED' simula a resposta postada. Bloqueado → ROUTED (humano decide).
      status: blocked ? 'ROUTED' : 'ANSWERED',
    });
  },

  list(orgId: string) {
    return InteractionModel.listByOrg(orgId);
  },
};
