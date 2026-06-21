// ============================================================
// SERVICE B1 — Pipeline de geração de UM ContentItem (roda no worker via fila).
//
// Fluxo: (item já existe em GERADO) → GenImage (mock|flux) → gate de consistência (mock|real) →
//        GenCaption (mock|claude) → selo de IA + #publi determinístico (B3) →
//        gate de segurança/compliance texto+imagem (mock|real) → EM_REVISAO.
//
// Cada etapa grava um Job (custo estimado). O item só chega a EM_REVISAO se passar nos
// gates; senão fica REPROVADO (gate) ou FALHOU (exceção/teto) com o motivo em qaFlags.
//
// A API cria N itens em GERADO (placeholder) e enfileira um job GENERATE_ITEM por item;
// o worker chama `generateOneContentItem({ contentItemId })`, que atualiza o MESMO item.
// Idempotência: se o item já não estiver em GERADO, no-op silencioso.
// ============================================================
import { prisma } from '../models/prisma.js';
import { createProviders } from '../providers/index.js';
import { config } from '../config/env.js';
import { angleForNiche, labelForNiche, hashtagsForNiche } from '../lib/niches.js';
import type { QaFlags, Asset, AffiliateLink } from '../models/dto.js';

const providers = createProviders();

const CONSISTENCY_THRESHOLD = config.consistencyThreshold;
const COST_LIMIT_PERSONA_DAILY = config.costLimitPersonaDailyBRL;

// Selo de IA exigido pela transparência da persona (aiDisclosure) — Conar/marca.
const AI_SEAL = '🤖 Conteúdo gerado por IA';

export interface GenerateOneParams {
  contentItemId: string;
}

// Soma o custo de jobs da org nas últimas 24h (teto de gasto — guardrail de custo).
async function spentLast24h(orgId: string): Promise<number> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const agg = await prisma.job.aggregate({
    _sum: { costEstimate: true },
    where: { orgId, createdAt: { gte: since } },
  });
  return agg._sum.costEstimate ?? 0;
}

async function recordJob(params: {
  orgId: string;
  contentItemId: string;
  type: 'GEN_IMAGE' | 'GEN_CAPTION' | 'CONSISTENCY_GATE' | 'SAFETY_GATE';
  status: 'DONE' | 'FAILED';
  costEstimate: number;
  logs?: unknown;
}) {
  await prisma.job.create({
    data: {
      orgId: params.orgId,
      contentItemId: params.contentItemId,
      type: params.type,
      status: params.status,
      payload: {},
      costEstimate: params.costEstimate,
      attempts: 1,
      logs: params.logs as object,
    },
  });
}

// ------------------------------------------------------------
// B3 — Selo de IA + #publi/#parceria determinístico.
// Roda DEPOIS de gerar a caption, INDEPENDENTE do provider de LLM: injeta o que faltar.
// ------------------------------------------------------------
function enforceDisclosure(
  caption: string,
  hasAffiliate: boolean,
): { caption: string; injected: string[] } {
  let out = caption;
  const injected: string[] = [];
  const has = (re: RegExp) => re.test(out);

  // 1) Selo de IA (sempre exigido — a persona declara ser IA).
  if (!has(/conteúdo gerado por ia/i) && !has(/🤖/)) {
    out = `${out.trimEnd()}\n\n${AI_SEAL}.`;
    injected.push('selo-ia-injetado');
  }

  // 2) #publi e #parceria só quando há link de afiliado/parceria (Conar).
  if (hasAffiliate) {
    if (!has(/#publi\b/i)) {
      out = `${out.trimEnd()} #publi`;
      injected.push('#publi-injetado');
    }
    if (!has(/#parceria\b/i)) {
      out = `${out.trimEnd()} #parceria`;
      injected.push('#parceria-injetado');
    }
  }

  return { caption: out, injected };
}

export async function generateOneContentItem(params: GenerateOneParams) {
  const { contentItemId } = params;

  // Carrega o item já criado pela API (placeholder GERADO).
  let item = await prisma.contentItem.findUnique({ where: { id: contentItemId } });
  if (!item) throw new Error(`ContentItem ${contentItemId} não encontrado.`);

  // IDEMPOTÊNCIA: só processamos itens em GERADO. Se já avançou, no-op silencioso.
  if (item.status !== 'GERADO') {
    return item;
  }

  const orgId = item.orgId;
  const pilar = item.pilar ?? 'lifestyle';
  const affiliateLinks = (item.affiliateLinks ?? []) as unknown as AffiliateLink[];
  const hasAffiliate = affiliateLinks.length > 0;

  const persona = await prisma.persona.findFirst({ where: { id: item.personaId, orgId } });
  if (!persona) throw new Error('Persona não encontrada nesta org.');

  // Teto de gasto diário por org. Estoura → item FALHOU (não derruba a fila).
  const spent = await spentLast24h(orgId);
  if (spent >= COST_LIMIT_PERSONA_DAILY) {
    item = await prisma.contentItem.update({
      where: { id: item.id },
      data: {
        status: 'FALHOU',
        qaFlags: {
          reason: `teto-de-gasto-diario-atingido (R$ ${spent.toFixed(2)} / R$ ${COST_LIMIT_PERSONA_DAILY})`,
        } as object,
      },
    });
    return item;
  }

  const visual = (persona.visualProfile ?? {}) as {
    loraId?: string | null;
    faceRefs?: { url: string; approved: boolean }[];
    paleta?: string[];
  };
  const personality = (persona.personality ?? {}) as { systemPrompt?: string };
  const approvedRefs = (visual.faceRefs ?? []).filter((r) => r.approved).map((r) => r.url);

  const qaFlags: QaFlags = {};

  try {
    // 1) GEN_IMAGE
    const imgRes = await providers.image.generate({
      prompt: `Isabella Souza, ${pilar}, golden hour, fotorrealista`,
      loraId: visual.loraId ?? null,
      faceRefUrls: approvedRefs,
      count: 1,
      seed: Math.abs(hashStr(item.id)) % 100000,
    });
    const generated = imgRes.data[0]!;
    const assets: Asset[] = [
      { kind: 'image', url: generated.url, width: generated.width, height: generated.height },
    ];
    await recordJob({
      orgId,
      contentItemId: item.id,
      type: 'GEN_IMAGE',
      status: 'DONE',
      costEstimate: imgRes.costEstimateBRL,
      logs: imgRes.raw,
    });

    // 2) Gate de consistência facial (B2) — score vs refs aprovadas, limiar configurável.
    const cons = await providers.consistency.score({
      imageUrl: generated.url,
      faceRefUrls: approvedRefs,
      threshold: CONSISTENCY_THRESHOLD,
    });
    qaFlags.consistencyScore = cons.data.score;
    await recordJob({
      orgId,
      contentItemId: item.id,
      type: 'CONSISTENCY_GATE',
      status: cons.data.passed ? 'DONE' : 'FAILED',
      costEstimate: cons.costEstimateBRL,
      logs: cons.raw,
    });
    if (!cons.data.passed) {
      item = await prisma.contentItem.update({
        where: { id: item.id },
        data: {
          status: 'REPROVADO',
          assets: assets as object,
          qaFlags: { ...qaFlags, reason: 'consistencia-abaixo-do-limiar' } as object,
        },
      });
      return item;
    }

    // 3) GEN_CAPTION (tom da Isabella) — provider selecionado por env (mock|claude).
    // O prompt usa o NICHO configurado: rótulo + ângulo de conteúdo do catálogo (leque).
    const capRes = await providers.llm.generateText({
      system: personality.systemPrompt ?? 'Você é a Isabella Souza.',
      prompt: `nicho: ${labelForNiche(pilar)} (pilar: ${pilar}) | tema: ${angleForNiche(pilar)}, no tom acolhedor da Isabella. Inclua hashtags relevantes do nicho.`,
      model: 'volume',
    });
    await recordJob({
      orgId,
      contentItemId: item.id,
      type: 'GEN_CAPTION',
      status: 'DONE',
      costEstimate: capRes.costEstimateBRL,
      logs: capRes.raw,
    });

    // 3b) B3 — selo de IA + #publi/#parceria DETERMINÍSTICO (independe do provider de LLM).
    const disclosure = enforceDisclosure(capRes.data, hasAffiliate);
    const caption = disclosure.caption;
    if (disclosure.injected.length) {
      qaFlags.compliance = [...(qaFlags.compliance ?? []), ...disclosure.injected];
    }
    // Hashtags = as que vieram na legenda + as do catálogo do nicho (sem duplicar),
    // garantindo tags relevantes mesmo que o provider não as inclua.
    const captionTags = caption.match(/#[\p{L}\w]+/gu) ?? [];
    const hashtags = Array.from(new Set([...captionTags, ...hashtagsForNiche(pilar)]));

    // 4) Gate de segurança + compliance (texto + imagem). hasAffiliateLink real (B3/Conar).
    const safety = await providers.safety.check({
      text: caption,
      imageUrls: [generated.url],
      hasAffiliateLink: hasAffiliate,
    });
    qaFlags.safety = safety.data.verdict;
    qaFlags.compliance = [...(qaFlags.compliance ?? []), ...safety.data.complianceActions];
    await recordJob({
      orgId,
      contentItemId: item.id,
      type: 'SAFETY_GATE',
      status: safety.data.verdict === 'block' ? 'FAILED' : 'DONE',
      costEstimate: safety.costEstimateBRL,
      logs: safety.raw,
    });

    if (safety.data.verdict === 'block') {
      item = await prisma.contentItem.update({
        where: { id: item.id },
        data: {
          status: 'REPROVADO',
          assets: assets as object,
          caption,
          hashtags,
          qaFlags: { ...qaFlags, reason: safety.data.reasons.join(',') } as object,
        },
      });
      return item;
    }

    // 5) Passou nos gates → EM_REVISAO (entra no kanban para o humano curar).
    item = await prisma.contentItem.update({
      where: { id: item.id },
      data: {
        status: 'EM_REVISAO',
        assets: assets as object,
        caption,
        hashtags,
        cta: 'Salva esse post 💛',
        qaFlags: qaFlags as object,
      },
    });
    return item;
  } catch (e) {
    // Falha de provider: NÃO marca FALHOU aqui (o no-op idempotente impediria o retry).
    // Re-lança para o BullMQ contabilizar a tentativa; quem persiste FALHOU é o worker.
    throw e;
  }
}

// Marca o item como FALHOU — chamado pelo worker quando o BullMQ esgota as tentativas.
export async function markItemFailed(contentItemId: string, reason: string) {
  const item = await prisma.contentItem.findUnique({ where: { id: contentItemId } });
  if (!item) return;
  // Não sobrescreve um estado terminal já definido por um gate.
  if (item.status === 'REPROVADO' || item.status === 'EM_REVISAO' || item.status === 'APROVADO') {
    return;
  }
  const prevQa = (item.qaFlags ?? {}) as Record<string, unknown>;
  await prisma.contentItem.update({
    where: { id: contentItemId },
    data: { status: 'FALHOU', qaFlags: { ...prevQa, reason } as object },
  });
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
