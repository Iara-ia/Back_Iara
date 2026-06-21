// Tipos comuns aos providers. Toda chamada retorna custo estimado para alimentar Job.costEstimate.
export interface ProviderResult<T> {
  data: T;
  costEstimateBRL: number;
  raw?: unknown; // resposta crua do provider (logs/debug)
}
