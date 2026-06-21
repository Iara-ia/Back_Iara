// Critério A1: um job de teste enfileira e processa ponta a ponta.
// Uso: npm run enqueue:test  (com Redis no ar e o worker rodando)
import { jobQueue } from '../services/index.js';

const job = await jobQueue.add(
  'test',
  { type: 'TEST' },
  { attempts: 3, backoff: { type: 'exponential', delay: 1000 } },
);
console.log(`[enqueue] job de teste enfileirado: ${job.id}`);
process.exit(0);
