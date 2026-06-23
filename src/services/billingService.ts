// ============================================================
// SERVICE — Billing (receita da plataforma SaaS). Provider-agnostic: mock|stripe por env.
//   - getBilling: plano atual da org + catálogo.
//   - createCheckout: mock ATIVA na hora (conveniência dev) e devolve activated:true;
//     stripe real devolve a URL do Checkout (a ativação vem depois via webhook → activate).
//   - activate: aplica o tier no Org (usado pelo mock e pelo webhook do Stripe).
// ============================================================
import { prisma } from '../models/prisma.js';
import { config } from '../config/env.js';
import { listPlans, PLAN_CATALOG, type PlanTier } from '../lib/plans.js';
import { ServiceError } from './errors.js';

export const BillingService = {
  async getBilling(orgId: string) {
    const org = await prisma.org.findUnique({ where: { id: orgId } });
    if (!org) throw new ServiceError(404, 'NOT_FOUND', 'Org não encontrada.');
    const plan = org.plan as PlanTier;
    return {
      plan,
      current: PLAN_CATALOG[plan] ?? PLAN_CATALOG.FREE,
      catalog: listPlans(),
      provider: config.billing.provider,
    };
  },

  async createCheckout(orgId: string, tier: PlanTier, email?: string) {
    if (!PLAN_CATALOG[tier]) throw new ServiceError(400, 'VALIDATION', 'Plano inválido.');

    if (config.billing.provider === 'stripe' && tier !== 'FREE') {
      const url = await createStripeCheckout(orgId, tier, email);
      return { url, activated: false as const, plan: tier };
    }

    // Mock (ou downgrade p/ FREE): ativa imediatamente — sem gateway externo.
    await this.activate(orgId, tier);
    return { url: null, activated: true as const, plan: tier };
  },

  async activate(orgId: string, tier: PlanTier) {
    if (!PLAN_CATALOG[tier]) throw new ServiceError(400, 'VALIDATION', 'Plano inválido.');
    const org = await prisma.org.update({ where: { id: orgId }, data: { plan: tier } });
    return { plan: org.plan as PlanTier };
  },
};

// Stripe real (env-gated). Import COMPUTADO p/ não exigir a dependência no typecheck/dev.
async function createStripeCheckout(
  orgId: string,
  tier: PlanTier,
  email?: string,
): Promise<string> {
  if (!config.billing.stripeSecretKey) {
    throw new ServiceError(500, 'CONFIG', 'STRIPE_SECRET_KEY ausente para PROVIDER_BILLING=stripe.');
  }
  const priceId = config.billing.priceIds[tier];
  if (!priceId) throw new ServiceError(500, 'CONFIG', `STRIPE_PRICE_${tier} ausente.`);

  const mod = (await import('@stripe' + '/stripe')) as { default?: unknown };
  const Stripe = (mod.default ?? mod) as new (k: string) => {
    checkout: {
      sessions: {
        create(args: unknown): Promise<{ url: string | null }>;
      };
    };
  };
  const stripe = new Stripe(config.billing.stripeSecretKey);
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${config.billing.successUrl}?org=${orgId}&plan=${tier}`,
    cancel_url: config.billing.cancelUrl,
    customer_email: email,
    metadata: { orgId, plan: tier },
  });
  if (!session.url) throw new ServiceError(502, 'STRIPE', 'Stripe não retornou URL de checkout.');
  return session.url;
}
