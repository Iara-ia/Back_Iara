// Criptografia simétrica dos tokens de conta social (AES-256-GCM).
// Em produção, troque por KMS. A chave vem de config.tokenEncKey (TOKEN_ENC_KEY).
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto';
import { config } from '../config/env.js';

function key(): Buffer {
  // Deriva 32 bytes determinísticos a partir do valor (aceita qualquer string em dev).
  return createHash('sha256').update(config.tokenEncKey).digest();
}

export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('base64'), tag.toString('base64'), enc.toString('base64')].join(':');
}

export function decrypt(blob: string): string {
  const [ivB64, tagB64, dataB64] = blob.split(':');
  const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(ivB64!, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64!, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(dataB64!, 'base64')), decipher.final()]).toString(
    'utf8',
  );
}
