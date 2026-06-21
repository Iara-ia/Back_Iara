// QA: prova de idempotência (jobId = contentItemId).
// Re-enfileira um item JÁ EM_REVISAO e confirma no-op: status/createdAt/Jobs inalterados.
// (ContentItem não tem updatedAt no schema; usamos contagem de Jobs do item + total de itens
//  como detectores de duplicação, e status/createdAt como invariantes.)
import { prisma } from '../../models/index.js';
import { enqueueGenerateItem, jobQueue } from '../../services/index.js';

const id = process.argv[2];
if (!id) { console.error('uso: _qaIdempotency.ts <contentItemId>'); process.exit(1); }

const before = await prisma.contentItem.findUnique({ where: { id } });
if (!before) { console.error('item nao encontrado'); process.exit(1); }
const jobsBefore = await prisma.job.count({ where: { contentItemId: id } });
const totalItemsBefore = await prisma.contentItem.count();

console.log(JSON.stringify({
  fase: 'ANTES',
  status: before.status,
  createdAt: before.createdAt,
  jobsDoItem: jobsBefore,
  totalItens: totalItemsBefore,
}, null, 2));

// Re-enfileira com o MESMO jobId (= contentItemId). BullMQ deve deduplicar / o pipeline faz no-op.
const job = await enqueueGenerateItem({
  contentItemId: id,
  orgId: before.orgId,
  personaId: before.personaId,
  pilar: before.pilar ?? 'lifestyle',
});
console.log('re-enfileirado jobId:', job.id, '(esperado === contentItemId:', id === job.id, ')');

// espera o worker eventualmente pegar (se pegar) e processar
await new Promise((r) => setTimeout(r, 6000));

const after = await prisma.contentItem.findUnique({ where: { id } });
const jobsAfter = await prisma.job.count({ where: { contentItemId: id } });
const totalItemsAfter = await prisma.contentItem.count();

console.log(JSON.stringify({
  fase: 'DEPOIS',
  status: after?.status,
  createdAt: after?.createdAt,
  jobsDoItem: jobsAfter,
  totalItens: totalItemsAfter,
}, null, 2));

console.log(JSON.stringify({
  veredito: {
    statusInalterado: before.status === after?.status,
    createdAtInalterado: before.createdAt?.getTime() === after?.createdAt?.getTime(),
    semJobsNovos: jobsBefore === jobsAfter,
    semItensDuplicados: totalItemsBefore === totalItemsAfter,
  },
}, null, 2));

await jobQueue.close();
process.exit(0);
