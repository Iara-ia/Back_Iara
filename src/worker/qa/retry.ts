// QA: prova de retry/backoff exponencial + FALHOU definitivo, ISOLADO numa fila de teste
// própria (não interfere no worker de produção em mock).
// A env PROVIDER_IMAGE=flux DEVE vir do shell (antes do load do módulo de providers),
// porque @iara/pipeline instancia os providers no import (createProviders no topo).
import { prisma } from '../../models/index.js';
import { generateOneContentItem, markItemFailed } from '../../services/index.js';
import { providersInfo } from '../../providers/index.js';
import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';

console.log('providersInfo:', JSON.stringify(providersInfo()));

const connection = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', { maxRetriesPerRequest: null });
const QN = 'iara-qa-retry';
const queue = new Queue(QN, { connection: connection as any });
const OPTS = { attempts: 3, backoff: { type: 'exponential' as const, delay: 1500 }, removeOnComplete: 10, removeOnFail: 10 };

const item = await prisma.contentItem.create({
  data: { orgId: 'org_iara_seed', personaId: 'persona_isabella', type: 'POST', pilar: 'saude', status: 'GERADO', assets: [], hashtags: [], platforms: [] },
});
console.log('item criado:', item.id, 'status=', item.status);

const attemptsLog: number[] = [];
const t0 = Date.now();

const worker = new Worker(
  QN,
  async (job) => {
    console.log(`[qa-retry] tentativa ${job.attemptsMade + 1} @ +${Date.now() - t0}ms`);
    attemptsLog.push(job.attemptsMade + 1);
    await generateOneContentItem({ contentItemId: job.data.contentItemId });
    return { ok: true };
  },
  { connection: connection as any, concurrency: 1 },
);

worker.on('failed', async (job, err) => {
  console.log(`[qa-retry] FALHA tentativa ${job?.attemptsMade}: ${err.message.slice(0, 70)}`);
  const attempts = job?.opts.attempts ?? 1;
  if (job && job.attemptsMade >= attempts) {
    await markItemFailed(item.id, `worker: ${err.message}`);
    console.log('[qa-retry] tentativas esgotadas → markItemFailed.');
  }
});

await queue.add('gen', { contentItemId: item.id }, { jobId: item.id, ...OPTS });
await new Promise((r) => setTimeout(r, 14000));

const after = await prisma.contentItem.findUnique({ where: { id: item.id } });
console.log(JSON.stringify({
  tentativasObservadas: attemptsLog, numTentativas: attemptsLog.length,
  decorridoMs: Date.now() - t0, statusFinal: after?.status, qaFlags: after?.qaFlags,
}, null, 2));

await worker.close(); await queue.close(); connection.disconnect(); process.exit(0);
