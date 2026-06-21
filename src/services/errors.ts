// Erro de domínio: carrega o status HTTP + código + detalhes para o controller/middleware
// traduzir no envelope de resposta padrão (err()). Mantém a regra de negócio no service,
// e o mapeamento HTTP no controller.
export class ServiceError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

export function isServiceError(e: unknown): e is ServiceError {
  return e instanceof ServiceError;
}
