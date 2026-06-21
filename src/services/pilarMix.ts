// ============================================================
// SERVICE B5 — Distribuidor de mix de pilares (lógica REAL, determinística).
//
// Dado um `count` (1..7) e um `pool` de pilares, distribui os N itens pelos pilares
// de forma EQUILIBRADA e DETERMINÍSTICA (round-robin), nunca aleatória.
//
// Garantias: determinístico (mesma entrada → mesma saída), equilibrado (diferença
// máx. de 1 entre pilar mais/menos usado), ordem estável.
// ============================================================

// Os 5 nichos da Isabella (default do distribuidor).
export const DEFAULT_PILARES = ['saude', 'moda', 'beleza', 'viagens', 'lifestyle'] as const;

export function distributePilares(count: number, pool?: string[]): string[] {
  const pilares = pool && pool.length > 0 ? pool : [...DEFAULT_PILARES];
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    out.push(pilares[i % pilares.length]!);
  }
  return out;
}
