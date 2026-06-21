// CONTROLLER: Storage — serve arquivos do storage local (stub do S3/R2). Público (sem auth).
import type { FastifyRequest, FastifyReply } from 'fastify';
import { createReadStream, existsSync } from 'node:fs';
import { join, normalize } from 'node:path';
import { STORAGE_ROOT } from '../config/storage.js';

export const StorageController = {
  async serve(req: FastifyRequest, reply: FastifyReply) {
    const rel = (req.params as Record<string, string>)['*'] ?? '';
    // previne path traversal
    const safe = normalize(rel).replace(/^(\.\.[/\\])+/, '');
    const full = join(STORAGE_ROOT, safe);
    if (!full.startsWith(STORAGE_ROOT) || !existsSync(full)) {
      reply.code(404);
      return { ok: false, error: { code: 'NOT_FOUND', message: 'Arquivo não encontrado.' } };
    }
    if (safe.endsWith('.png')) reply.type('image/png');
    else if (safe.endsWith('.json')) reply.type('application/json');
    else reply.type('application/octet-stream');
    return reply.send(createReadStream(full));
  },
};
