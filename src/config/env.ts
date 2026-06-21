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
  isProd: process.env.NODE_ENV === 'production',
  isDev: process.env.NODE_ENV === 'development',
} as const;
