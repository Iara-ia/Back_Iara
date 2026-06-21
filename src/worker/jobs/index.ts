// Pipeline de geração (Épico B). A geração de conteúdo roda 100% via fila — a API enfileira
// GENERATE_ITEM (um por item) e este handler chama o pipeline (services), que atualiza o
// MESMO ContentItem até EM_REVISAO/REPROVADO/FALHOU.
//
// Idempotência: jobId = contentItemId; o pipeline faz no-op se o item já não estiver em GERADO.
// Retry/backoff: configurado na fila (GENERATE_ITEM_JOB_OPTS). FALHOU só na última tentativa.
import { generateOneContentItem, type IaraJobData } from '../../services/index.js';

export type JobData = IaraJobData;

// Roteador de jobs. Retorna uma nota para o log; lança em falha (BullMQ contabiliza a tentativa).
export async function handleJob(data: JobData): Promise<{ ok: boolean; note: string }> {
  switch (data.type) {
    case 'TEST':
      return { ok: true, note: 'job de teste processado (critério A1)' };

    case 'GENERATE_ITEM': {
      const { contentItemId, pilar } = data.payload;
      const item = await generateOneContentItem({ contentItemId });
      return {
        ok: true,
        note: `GENERATE_ITEM ${contentItemId} (pilar=${pilar}) → ${item.status}`,
      };
    }

    default:
      return {
        ok: false,
        note: `tipo de job desconhecido: ${String((data as { type?: string }).type)}`,
      };
  }
}
