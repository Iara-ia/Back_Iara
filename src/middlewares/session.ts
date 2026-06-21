// ============================================================
// MIDDLEWARE A2 — Sessão + isolamento por orgId + RBAC (owner/editor/viewer).
//
// MVP (dev): a sessão vem por headers `x-user-id` / `x-org-id`. Se ausentes, cai no
// usuário/seed owner (fundador@iara.app) para o demo rodar sem fricção.
// Em produção, este arquivo é o ÚNICO ponto a trocar por Clerk/Auth.js — o resto do
// código depende apenas de `req.session` (userId, orgId, role).
//
// REGRA DE OURO: toda query de domínio filtra por `req.session.orgId`. Nunca confie
// num orgId vindo do body. Helpers de RBAC (canWrite/canApprove) vivem em services/rbac.
// ============================================================
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UserModel } from '../models/userModel.js';
import { canWrite } from '../services/rbac.js';
import { err } from '../lib/reply.js';
import { config } from '../config/env.js';
import { prisma } from '../models/prisma.js';
import type { Role } from '../lib/enums.js';

export interface Session {
  userId: string;
  orgId: string;
  role: Role;
  email: string;
  name: string | null;
  orgName: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    session: Session;
  }
}

// Resolve a sessão a partir dos headers; valida que o usuário existe e que o orgId bate.
async function resolveSession(req: FastifyRequest): Promise<Session | null> {
  const userIdHeader = (req.headers['x-user-id'] as string | undefined)?.trim();
  const orgIdHeader = (req.headers['x-org-id'] as string | undefined)?.trim();

  const user = userIdHeader
    ? await UserModel.findByIdWithOrg(userIdHeader)
    : await UserModel.findSeedOwner();

  if (!user) return null;

  // Se o header de org foi enviado, ele PRECISA bater com a org do usuário (isolamento).
  if (orgIdHeader && orgIdHeader !== user.orgId) return null;

  return {
    userId: user.id,
    orgId: user.orgId,
    role: user.role,
    email: user.email,
    name: user.name,
    orgName: user.org.name,
  };
}

// AUTH real (Clerk), env-gated. Ligar: AUTH_PROVIDER=clerk + CLERK_SECRET_KEY + `npm i @clerk/backend`.
// Verifica o JWT do Clerk (Authorization: Bearer) e mapeia o e-mail para o nosso User.
// Sem token Bearer, retorna null → cai no resolveSession (dev header) para o painel seguir.
async function resolveClerkSession(req: FastifyRequest): Promise<Session | null> {
  const auth = req.headers['authorization'];
  const token = typeof auth === 'string' && /^Bearer /i.test(auth) ? auth.slice(7).trim() : '';
  if (!token) return null;
  if (!config.clerkSecretKey) {
    throw new Error('AUTH_PROVIDER=clerk requer CLERK_SECRET_KEY (e `npm i @clerk/backend`).');
  }
  const sdkName = '@clerk' + '/backend'; // specifier computado: SDK só exigido em runtime
  const mod = (await import(sdkName)) as {
    verifyToken: (t: string, o: { secretKey: string }) => Promise<Record<string, unknown>>;
  };
  const claims = await mod.verifyToken(token, { secretKey: config.clerkSecretKey });
  const email = String(claims['email'] ?? claims['email_address'] ?? '');
  if (!email) return null;
  const user = await prisma.user.findFirst({ where: { email }, include: { org: true } });
  if (!user) return null;
  return {
    userId: user.id,
    orgId: user.orgId,
    role: user.role,
    email: user.email,
    name: user.name,
    orgName: user.org.name,
  };
}

// Rotas públicas (sem auth). /storage/* tratado por prefixo abaixo.
const PUBLIC_PATHS = new Set(['/health']);

export function registerAuth(app: FastifyInstance) {
  app.addHook('onRequest', async (req, reply) => {
    if (PUBLIC_PATHS.has(req.url.split('?')[0]!) || req.url.startsWith('/storage/')) return;
    const session =
      config.authProvider === 'clerk'
        ? ((await resolveClerkSession(req)) ?? (await resolveSession(req)))
        : await resolveSession(req);
    if (!session) {
      reply.code(401);
      return reply.send(err('UNAUTHENTICATED', 'Sessão inválida ou usuário não encontrado.'));
    }
    req.session = session;
  });
}

// Guard reutilizável para handlers de escrita (viewer não escreve).
export function denyIfReadOnly(req: FastifyRequest, reply: FastifyReply): boolean {
  if (!canWrite(req.session.role)) {
    reply.code(403);
    reply.send(err('FORBIDDEN', 'Seu papel (viewer) não permite esta ação.'));
    return true;
  }
  return false;
}
