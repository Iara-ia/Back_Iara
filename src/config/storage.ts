// ============================================================
// Storage local (stub do S3/R2 para o MVP dev).
// Grava arquivos em <repo>/.storage e serve via GET /storage/* (middleware/route).
// Em produção, troque por upload ao R2/S3 (STORAGE_PROVIDER=r2|s3) — mesma assinatura.
// ============================================================
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './env.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
// src/config -> repo raiz/.storage
export const STORAGE_ROOT = join(__dirname, '..', '..', '.storage');

export async function ensureStorage() {
  if (!existsSync(STORAGE_ROOT)) await mkdir(STORAGE_ROOT, { recursive: true });
}

// Salva um buffer/texto e retorna a URL pública servível.
export async function putObject(key: string, data: Buffer | string): Promise<string> {
  const full = join(STORAGE_ROOT, key);
  await mkdir(dirname(full), { recursive: true });
  await writeFile(full, data);
  return `${config.api.baseUrl}/storage/${key}`;
}

export function publicUrl(key: string): string {
  return `${config.api.baseUrl}/storage/${key}`;
}
