// ============================================================
// SERVICE: Fila BullMQ compartilhada — ÂNCORA da geração assíncrona.
//
// Vive na camada de service para que TANTO a API (produtor: enfileira GENERATE_ITEM)
// quanto o worker (consumidor) importem a MESMA fila/conexão. O worker é o único que
// dá `new Worker(...)`; a API só usa `enqueueGenerateItem(...)`.
// ============================================================
import { Queue } from 'bullmq';
import type { ConnectionOptions } from 'bullmq';
import { Redis } from 'ioredis';
import { config } from '../config/env.js';

// BullMQ aceita uma instância IORedis em runtime; o cast resolve a divergência de tipos.
export const connection = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null, // requisito do BullMQ
}) as unknown as ConnectionOptions;

export const QUEUE_NAME = 'iara-jobs';

// Singleton: evita abrir múltiplas conexões em dev/hot-reload.
const globalForQueue = globalThis as unknown as { iaraJobQueue?: Queue };

export const jobQueue: Queue =
  globalForQueue.iaraJobQueue ?? new Queue(QUEUE_NAME, { connection });

if (process.env.NODE_ENV !== 'production') globalForQueue.iaraJobQueue = jobQueue;

// Retry/backoff exponencial; após a última falha o item fica FALHOU (worker).
export const GENERATE_ITEM_JOB_OPTS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 1500 },
  removeOnComplete: 1000,
  removeOnFail: 1000,
};

export interface GenerateItemPayload {
  contentItemId: string;
  orgId: string;
  personaId: string;
  pilar: string;
}

export interface PublishItemPayload {
  contentItemId: string;
  orgId: string;
}

export type IaraJobData =
  | { type: 'GENERATE_ITEM'; payload: GenerateItemPayload }
  | { type: 'PUBLISH_ITEM'; payload: PublishItemPayload }
  | { type: 'TEST'; payload?: Record<string, unknown> };

// Enfileiramento idempotente: jobId = contentItemId (BullMQ deduplica por jobId).
export async function enqueueGenerateItem(payload: GenerateItemPayload) {
  return jobQueue.add('generate-item', { type: 'GENERATE_ITEM', payload } as IaraJobData, {
    jobId: payload.contentItemId,
    ...GENERATE_ITEM_JOB_OPTS,
  });
}

// Sprint 3 — publicação agendada: job ATRASADO (delay até a hora marcada). BullMQ dispara
// sozinho quando o delay vence; o worker chama o provider de distribuição (mock|ayrshare).
export const PUBLISH_ITEM_JOB_OPTS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 2000 },
  removeOnComplete: 1000,
  removeOnFail: 1000,
};

export async function enqueuePublishItem(payload: PublishItemPayload, delayMs = 0) {
  return jobQueue.add('publish-item', { type: 'PUBLISH_ITEM', payload } as IaraJobData, {
    jobId: `publish-${payload.contentItemId}`,
    delay: Math.max(0, Math.floor(delayMs)),
    ...PUBLISH_ITEM_JOB_OPTS,
  });
}
