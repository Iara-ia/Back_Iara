// Helpers para o envelope de resposta padrão (ApiResponse).
import type { ApiOk, ApiErr } from './contracts.js';

export function ok<T>(data: T): ApiOk<T> {
  return { ok: true, data };
}

export function err(code: string, message: string, details?: unknown): ApiErr {
  return { ok: false, error: { code, message, details } };
}
