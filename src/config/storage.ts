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
// STORAGE_PROVIDER=local (default) → grava em .storage; =s3|r2 → sobe ao bucket.
export async function putObject(key: string, data: Buffer | string): Promise<string> {
  const provider = config.storage.provider;
  if (provider === 's3' || provider === 'r2') return putObjectS3(key, data);

  const full = join(STORAGE_ROOT, key);
  await mkdir(dirname(full), { recursive: true });
  await writeFile(full, data);
  return publicUrl(key);
}

// S3/R2 real (env-gated). Ligar: STORAGE_PROVIDER=s3|r2 + STORAGE_BUCKET/REGION/ACCESS_KEY/SECRET
// + (R2/MinIO) STORAGE_ENDPOINT + STORAGE_PUBLIC_BASE_URL (CDN). E `npm i @aws-sdk/client-s3`.
async function putObjectS3(key: string, data: Buffer | string): Promise<string> {
  const s = config.storage;
  if (!s.bucket || !s.accessKeyId || !s.secretAccessKey) {
    throw new Error(
      'Storage S3/R2: defina STORAGE_BUCKET / STORAGE_ACCESS_KEY_ID / STORAGE_SECRET_ACCESS_KEY (ou STORAGE_PROVIDER=local).',
    );
  }
  // Specifier computado: o @aws-sdk/client-s3 só é exigido em runtime quando o S3 está ligado
  // (não vira dependência do typecheck/local). Instale-o para usar.
  const sdkName = '@aws-sdk' + '/client-s3';
  const mod = (await import(sdkName)) as {
    S3Client: new (cfg: unknown) => { send: (cmd: unknown) => Promise<unknown> };
    PutObjectCommand: new (input: unknown) => unknown;
  };
  const client = new mod.S3Client({
    region: s.region,
    ...(s.endpoint ? { endpoint: s.endpoint, forcePathStyle: true } : {}),
    credentials: { accessKeyId: s.accessKeyId, secretAccessKey: s.secretAccessKey },
  });
  await client.send(
    new mod.PutObjectCommand({
      Bucket: s.bucket,
      Key: key,
      Body: typeof data === 'string' ? Buffer.from(data) : data,
    }),
  );
  return publicUrl(key);
}

export function publicUrl(key: string): string {
  const base = config.storage.publicBaseUrl;
  if (base) return `${base.replace(/\/$/, '')}/${key}`;
  return `${config.api.baseUrl}/storage/${key}`;
}
