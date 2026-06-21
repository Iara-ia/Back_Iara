// ============================================================
// SERVICE: regras de negócio de Conteúdo (Épico B + HITL no kanban).
//
// Concentra: orquestração da geração (cria placeholders + enfileira), transições de
// status do kanban, GATES de aprovação (consistência/safety/compliance) e re-avaliação
// de safety ao editar a legenda. RBAC de "aprovar" é decidido aqui (recebe o role).
// ============================================================
import { ContentModel } from '../models/contentModel.js';
import { PersonaModel } from '../models/personaModel.js';
import { distributePilares } from './pilarMix.js';
import { enqueueGenerateItem, enqueuePublishItem } from './queue.js';
import { createProviders } from '../providers/index.js';
import { config } from '../config/env.js';
import { canApprove, canWrite } from './rbac.js';
import { ServiceError } from './errors.js';
import type { Role, SocialPlatform } from '../lib/enums.js';
import type {
  GenerateContentInput,
  PatchContentInput,
  ScheduleContentInput,
  SetAffiliateLinksInput,
} from '../lib/contracts.js';

const providers = createProviders();

// Transições de status permitidas no kanban (HITL). Aprovar exige gates ok.
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  GERADO: ['EM_REVISAO', 'REPROVADO'],
  EM_REVISAO: ['APROVADO', 'REPROVADO', 'GERADO'],
  APROVADO: ['EM_REVISAO', 'AGENDADO'],
  REPROVADO: ['EM_REVISAO'],
  FALHOU: ['EM_REVISAO'],
};

export const ContentService = {
  // POST /content/generate — cria N ContentItems em GERADO (placeholder) e ENFILEIRA
  // um job GENERATE_ITEM por item. A geração roda ASSÍNCRONA no worker.
  async generate(orgId: string, input: GenerateContentInput) {
    const { personaId, count, pilares, affiliateLinks } = input;

    const persona = await PersonaModel.findByIdInOrg(personaId, orgId);
    if (!persona) throw new ServiceError(404, 'NOT_FOUND', 'Persona não encontrada nesta org.');

    // B5 — distribuição REAL e determinística do mix de pilares pelos N itens.
    // O "leque" da persona manda: usa os nichos configurados dela como pool; se o
    // request mandar `pilares` explícitos, eles têm prioridade; só cai no default
    // global se a persona não tiver nicho nenhum configurado.
    const pool =
      pilares && pilares.length > 0
        ? pilares
        : persona.niches && persona.niches.length > 0
          ? persona.niches
          : undefined;
    const pilaresAtribuidos = distributePilares(count, pool);
    const links = affiliateLinks ?? [];

    const items = [];
    for (const pilar of pilaresAtribuidos) {
      const item = await ContentModel.create({
        orgId,
        personaId,
        type: 'POST',
        pilar,
        status: 'GERADO',
        assets: [],
        hashtags: [],
        platforms: [],
        ...(links.length ? { affiliateLinks: links as object } : {}),
      });
      await enqueueGenerateItem({ contentItemId: item.id, orgId, personaId, pilar });
      items.push(item);
    }
    return items;
  },

  list(orgId: string, filters: { status?: string; personaId?: string }) {
    return ContentModel.listByOrg(orgId, filters);
  },

  // PATCH /content/:id — editar legenda / mover status. Aprovar valida gates + RBAC.
  async patch(id: string, orgId: string, role: Role, userId: string, d: PatchContentInput) {
    const item = await ContentModel.findByIdInOrg(id, orgId);
    if (!item) throw new ServiceError(404, 'NOT_FOUND', 'Item não encontrado nesta org.');

    // Validação de transição de status, quando há mudança.
    if (d.status && d.status !== item.status) {
      const allowed = ALLOWED_TRANSITIONS[item.status] ?? [];
      if (!allowed.includes(d.status)) {
        throw new ServiceError(
          409,
          'INVALID_TRANSITION',
          `Transição ${item.status} → ${d.status} não permitida.`,
        );
      }
      if (d.status === 'APROVADO') {
        if (!canApprove(role)) {
          throw new ServiceError(403, 'FORBIDDEN', 'Seu papel não permite aprovar.');
        }
        // Gate: só aprova item que passou nos checks.
        //  - consistência facial >= limiar
        //  - safety: 'block' nunca aprova; 'flag' exige revisão humana explícita
        const qa = (item.qaFlags ?? {}) as { consistencyScore?: number; safety?: string };
        const consistencyOk = (qa.consistencyScore ?? 0) >= config.consistencyThreshold;
        const safetyOk = qa.safety !== 'block' && qa.safety !== 'flag';
        if (!consistencyOk || !safetyOk) {
          throw new ServiceError(
            422,
            'GATE_BLOCKED',
            qa.safety === 'block'
              ? 'Bloqueado por compliance (afirmação médica/promessa de resultado). Não pode ser aprovado.'
              : qa.safety === 'flag'
                ? 'Marcado para revisão (flag de compliance). Edite/resolva antes de aprovar.'
                : 'Item não passou no gate de consistência facial.',
            qa,
          );
        }
      }
    }

    // Editar a legenda re-roda o gate de safety: resolve um flag corrigido ou re-barra
    // uma violação recém-introduzida (mantém o HITL honesto).
    let reEvaluatedQa: object | undefined;
    if (d.caption !== undefined && d.caption !== item.caption) {
      const affiliateLinks = (item.affiliateLinks ?? []) as unknown[];
      const safety = await providers.safety.check({
        text: d.caption,
        hasAffiliateLink: affiliateLinks.length > 0,
      });
      const prevQa = (item.qaFlags ?? {}) as Record<string, unknown>;
      reEvaluatedQa = {
        ...prevQa,
        safety: safety.data.verdict,
        compliance: safety.data.complianceActions,
        ...(safety.data.reasons.length ? { safetyReasons: safety.data.reasons } : {}),
      };
    }

    const willApprove = d.status === 'APROVADO' && item.status !== 'APROVADO';
    return ContentModel.update(id, {
      ...(d.caption !== undefined ? { caption: d.caption } : {}),
      ...(d.hashtags !== undefined ? { hashtags: d.hashtags } : {}),
      ...(d.cta !== undefined ? { cta: d.cta } : {}),
      ...(d.status !== undefined ? { status: d.status } : {}),
      ...(reEvaluatedQa ? { qaFlags: reEvaluatedQa } : {}),
      ...(willApprove ? { approvedBy: userId, approvedAt: new Date() } : {}),
    });
  },

  // POST /content/:id/schedule (Sprint 3) — agenda um item APROVADO para publicação automática.
  // Marca AGENDADO + scheduleAt + plataformas e enfileira um job ATRASADO (delay até a hora).
  // O worker publica sozinho quando o delay vence.
  async schedule(id: string, orgId: string, role: Role, d: ScheduleContentInput) {
    if (!canWrite(role)) throw new ServiceError(403, 'FORBIDDEN', 'Seu papel não permite agendar.');
    const item = await ContentModel.findByIdInOrg(id, orgId);
    if (!item) throw new ServiceError(404, 'NOT_FOUND', 'Item não encontrado nesta org.');
    if (item.status !== 'APROVADO') {
      throw new ServiceError(
        409,
        'INVALID_STATE',
        `Só itens APROVADOS podem ser agendados (status atual: ${item.status}).`,
      );
    }
    const when = new Date(d.scheduleAt);
    const updated = await ContentModel.update(id, {
      status: 'AGENDADO',
      scheduleAt: when,
      platforms: d.platforms as SocialPlatform[],
    });
    await enqueuePublishItem({ contentItemId: id, orgId }, when.getTime() - Date.now());
    return updated;
  },

  // POST /content/:id/affiliate-links (Sprint 3) — define os links de afiliado/parceria do item.
  // Ter afiliado dispara o selo Conar: garante #publi na legenda e registra compliance.
  async setAffiliateLinks(id: string, orgId: string, role: Role, d: SetAffiliateLinksInput) {
    if (!canWrite(role)) throw new ServiceError(403, 'FORBIDDEN', 'Seu papel não permite editar.');
    const item = await ContentModel.findByIdInOrg(id, orgId);
    if (!item) throw new ServiceError(404, 'NOT_FOUND', 'Item não encontrado nesta org.');

    const hasLinks = d.links.length > 0;
    const hashtags = (item.hashtags ?? []) as string[];
    const compliance = ((item.qaFlags ?? {}) as { compliance?: string[] }).compliance ?? [];

    let caption = item.caption ?? '';
    const newCompliance = [...compliance];
    if (hasLinks && !/#publi/i.test(caption)) {
      // Conar: conteúdo com afiliado/parceria precisa de #publi explícito.
      caption = caption ? `${caption} #publi` : '#publi';
      if (!hashtags.some((h) => /#publi/i.test(h))) hashtags.push('#publi');
      if (!newCompliance.includes('publi-injetado')) newCompliance.push('publi-injetado');
    }

    return ContentModel.update(id, {
      affiliateLinks: d.links as object,
      caption,
      hashtags,
      qaFlags: { ...((item.qaFlags ?? {}) as object), compliance: newCompliance } as object,
    });
  },
};
