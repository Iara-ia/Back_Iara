// Worker BullMQ: consome a fila "iara-jobs" e despacha para o pipeline de jobs.
import { Worker } from 'bullmq';
import { connection, QUEUE_NAME, markItemFailed } from '../services/index.js';
import { providersInfo } from '../providers/index.js';
import { handleJob, type JobData } from './jobs/index.js';

const worker = new Worker<JobData>(
  QUEUE_NAME,
  async (job) => {
    if (job.data.type === 'GENERATE_ITEM') {
      console.log(
        `[worker] processando job ${job.id} GENERATE_ITEM (tentativa ${job.attemptsMade + 1})`,
      );
    }
    const result = await handleJob(job.data);
    if (!result.ok) throw new Error(result.note);
    return result;
  },
  {
    connection,
    concurrency: 4,
  },
);

worker.on('completed', (job, result) => {
  console.log(`[worker] job ${job.id} OK:`, result);
});

worker.on('failed', async (job, err) => {
  console.error(`[worker] job ${job?.id} FALHOU (tentativa ${job?.attemptsMade}):`, err.message);
  // Falha DEFINITIVA (todas as tentativas esgotadas): marca o ContentItem FALHOU com o motivo.
  // Tentativas intermediárias deixam o item em GERADO para o retry.
  if (job && job.data.type === 'GENERATE_ITEM') {
    const attempts = job.opts.attempts ?? 1;
    if (job.attemptsMade >= attempts) {
      await markItemFailed(job.data.payload.contentItemId, `worker: ${err.message}`);
      console.error(
        `[worker] item ${job.data.payload.contentItemId} marcado FALHOU (tentativas esgotadas).`,
      );
    }
  }
});

console.log(`[worker] ouvindo a fila "${QUEUE_NAME}"...`);
console.log(`[worker] providers ativos:`, providersInfo());
