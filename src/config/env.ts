// Configuração central de ambiente. Único ponto que lê process.env para valores de domínio.
export const config = {
  api: {
    port: Number(process.env.API_PORT ?? 3333),
    baseUrl: process.env.API_BASE_URL ?? 'http://localhost:3333',
  },
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  // Gate de consistência facial (limiar 0..1). Abaixo do limiar → item REPROVADO.
  consistencyThreshold: Number(process.env.CONSISTENCY_THRESHOLD ?? 0.8),
  // Teto de gasto diário por org (guardrail de custo).
  costLimitPersonaDailyBRL: Number(process.env.COST_LIMIT_PERSONA_DAILY_BRL ?? 50),
  // Chave de criptografia dos tokens sociais (em prod: KMS).
  tokenEncKey: process.env.TOKEN_ENC_KEY ?? 'dev-fallback-key-troque-isto',
  // Auth: 'dev' (header x-user-id) | 'clerk' (verifica token Clerk). Real exige CLERK_SECRET_KEY.
  authProvider: (process.env.AUTH_PROVIDER ?? 'dev').toLowerCase(),
  clerkSecretKey: process.env.CLERK_SECRET_KEY ?? '',
  // Storage: 'local' (.storage + GET /storage/*) | 's3' | 'r2'. Real exige as chaves S3_* abaixo.
  storage: {
    provider: (process.env.STORAGE_PROVIDER ?? 'local').toLowerCase(),
    bucket: process.env.S3_BUCKET ?? '',
    region: process.env.S3_REGION ?? 'us-east-1',
    endpoint: process.env.S3_ENDPOINT ?? '', // R2/MinIO; vazio = AWS S3 padrão
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
    publicBaseUrl: process.env.STORAGE_PUBLIC_BASE_URL ?? '', // CDN/CloudFront; vazio = local
  },
  // Billing SaaS: 'mock' (ativa na hora, sem gateway) | 'stripe' (Checkout real).
  // Real exige STRIPE_SECRET_KEY + STRIPE_PRICE_{STARTER,PRO,SCALE} + `npm i stripe`.
  billing: {
    provider: (process.env.PROVIDER_BILLING ?? 'mock').toLowerCase(),
    stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? '',
    priceIds: {
      FREE: '',
      STARTER: process.env.STRIPE_PRICE_STARTER ?? '',
      PRO: process.env.STRIPE_PRICE_PRO ?? '',
      SCALE: process.env.STRIPE_PRICE_SCALE ?? '',
    } as Record<string, string>,
    successUrl: process.env.BILLING_SUCCESS_URL ?? 'http://localhost:3000/planos?ok=1',
    cancelUrl: process.env.BILLING_CANCEL_URL ?? 'http://localhost:3000/planos',
  },
  isProd: process.env.NODE_ENV === 'production',
  isDev: process.env.NODE_ENV === 'development',
} as const;
