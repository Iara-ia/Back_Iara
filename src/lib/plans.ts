// Catálogo de planos do SaaS (receita da plataforma). Preços/limites ILUSTRATIVOS — revisar.
// Fonte única de verdade dos limites por tier; o billing e (futuramente) o enforcement leem daqui.
export type PlanTier = 'FREE' | 'STARTER' | 'PRO' | 'SCALE';

export interface PlanLimits {
  personas: number; // máx. de personas
  postsPerMonth: number; // cota de itens gerados/mês (-1 = ilimitado)
  reels: boolean; // pode gerar Reel (vídeo+voz)
  autoPublish: boolean; // piloto automático + auto-publish
  whiteLabel: boolean;
}

export interface PlanDef {
  tier: PlanTier;
  label: string;
  priceBRLMonthly: number;
  highlights: string[];
  limits: PlanLimits;
}

export const PLAN_CATALOG: Record<PlanTier, PlanDef> = {
  FREE: {
    tier: 'FREE',
    label: 'Grátis',
    priceBRLMonthly: 0,
    highlights: ['1 persona', '10 posts/mês', 'Gates de segurança', 'Sem auto-publish'],
    limits: { personas: 1, postsPerMonth: 10, reels: false, autoPublish: false, whiteLabel: false },
  },
  STARTER: {
    tier: 'STARTER',
    label: 'Starter',
    priceBRLMonthly: 97,
    highlights: ['1 persona', '100 posts/mês', 'Agendar + auto-publish', 'Afiliados + tracking'],
    limits: { personas: 1, postsPerMonth: 100, reels: false, autoPublish: true, whiteLabel: false },
  },
  PRO: {
    tier: 'PRO',
    label: 'Pro',
    priceBRLMonthly: 297,
    highlights: ['3 personas', '500 posts/mês', 'Reels (vídeo+voz)', 'Piloto automático + analytics'],
    limits: { personas: 3, postsPerMonth: 500, reels: true, autoPublish: true, whiteLabel: false },
  },
  SCALE: {
    tier: 'SCALE',
    label: 'Scale',
    priceBRLMonthly: 897,
    highlights: ['10 personas', 'Geração ilimitada', 'White-label', 'Suporte prioritário'],
    limits: { personas: 10, postsPerMonth: -1, reels: true, autoPublish: true, whiteLabel: true },
  },
};

export function listPlans(): PlanDef[] {
  return ['FREE', 'STARTER', 'PRO', 'SCALE'].map((t) => PLAN_CATALOG[t as PlanTier]);
}

export function limitsFor(tier: PlanTier): PlanLimits {
  return (PLAN_CATALOG[tier] ?? PLAN_CATALOG.FREE).limits;
}
