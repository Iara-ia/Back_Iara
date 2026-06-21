// SERVICE: RBAC (owner/editor/viewer). Regras puras de papel — sem Fastify, testáveis.
import type { Role } from '../lib/enums.js';

const ROLE_RANK: Record<Role, number> = { VIEWER: 0, EDITOR: 1, OWNER: 2 };

export function canWrite(role: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK.EDITOR; // editor e owner escrevem
}

export function canApprove(role: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK.EDITOR; // viewer NÃO aprova/publica
}
