// ============================================================
// Contratos de API (FONTE DE VERDADE) — schemas Zod + tipos derivados.
//
// Este arquivo é a referência única dos contratos req/resp. O Front-Iara mantém uma
// CÓPIA VENDORADA dos TIPOS (sem Zod) em Front-Iara/lib/contracts.ts — ao mudar um
// schema aqui, re-sincronize lá (instruções no cabeçalho daquele arquivo).
// ============================================================
import { z } from 'zod';

export const SocialPlatformSchema = z.enum([
  'INSTAGRAM',
  'TIKTOK',
  'YOUTUBE',
  'FACEBOOK',
  'X',
  'THREADS',
  'KWAI',
  'PINTEREST',
]);
export const ContentStatusSchema = z.enum([
  'RASCUNHO',
  'GERADO',
  'EM_REVISAO',
  'APROVADO',
  'AGENDADO',
  'PUBLICADO',
  'FALHOU',
  'REPROVADO',
]);

// ---- POST /personas (criar nova persona — multi-persona) ----
export const CreatePersonaSchema = z.object({
  name: z.string().min(2),
  bio: z.string().optional(),
  niches: z.array(z.string()).optional(),
  language: z.string().optional(),
  systemPrompt: z.string().optional(),
  tom: z.string().optional(),
});
export type CreatePersonaInput = z.infer<typeof CreatePersonaSchema>;

// ---- PUT /personas/:id ----
export const UpdatePersonaSchema = z.object({
  name: z.string().min(1).optional(),
  bio: z.string().nullable().optional(),
  niches: z.array(z.string()).optional(),
  language: z.string().optional(),
  visualProfile: z
    .object({
      loraId: z.string().nullable(),
      faceRefs: z.array(z.object({ url: z.string().url(), approved: z.boolean() })),
      paleta: z.array(z.string()),
    })
    .optional(),
  personality: z
    .object({
      systemPrompt: z.string(),
      tom: z.string(),
      do: z.array(z.string()),
      dont: z.array(z.string()),
    })
    .optional(),
  aiDisclosure: z.boolean().optional(),
});
export type UpdatePersonaInput = z.infer<typeof UpdatePersonaSchema>;

// ---- POST /personas/:id/refs ----
export const UploadRefsSchema = z.object({
  urls: z.array(z.string().url()).min(1),
});
export type UploadRefsInput = z.infer<typeof UploadRefsSchema>;

// ---- POST /social-accounts/connect ----
export const ConnectSocialSchema = z.object({
  personaId: z.string(),
  platform: SocialPlatformSchema,
  handle: z.string().min(1),
});
export type ConnectSocialInput = z.infer<typeof ConnectSocialSchema>;

// ---- Link de afiliado/parceria ---- (compartilhado por /generate e /affiliate-links)
export const AffiliateLinkSchema = z.object({
  url: z.string().url(),
  network: z.string(),
  utm: z.string().optional(),
  cupom: z.string().optional(),
});
export type AffiliateLinkInput = z.infer<typeof AffiliateLinkSchema>;

// ---- POST /content/generate ---- (enfileira lote imagem+legenda; geração é ASSÍNCRONA)
export const GenerateContentSchema = z.object({
  personaId: z.string(),
  count: z.number().int().min(1).max(7).default(7),
  pilares: z.array(z.string()).optional(), // mix de pilares (B5)
  type: z.enum(['POST', 'REEL']).optional(), // POST (default) | REEL (vídeo+voz)
  affiliateLinks: z.array(AffiliateLinkSchema).optional(),
});
export type GenerateContentInput = z.infer<typeof GenerateContentSchema>;

// ---- GET /content?status= ----
export const ListContentQuerySchema = z.object({
  status: ContentStatusSchema.optional(),
  personaId: z.string().optional(),
});
export type ListContentQuery = z.infer<typeof ListContentQuerySchema>;

// ---- PATCH /content/:id ---- (editar legenda / mover status / aprovar)
export const PatchContentSchema = z.object({
  caption: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  cta: z.string().nullable().optional(),
  status: ContentStatusSchema.optional(),
});
export type PatchContentInput = z.infer<typeof PatchContentSchema>;

// ---- POST /content/:id/schedule ----
export const ScheduleContentSchema = z.object({
  scheduleAt: z.string().datetime(),
  platforms: z.array(SocialPlatformSchema).min(1),
});
export type ScheduleContentInput = z.infer<typeof ScheduleContentSchema>;

// ---- POST /content/:id/affiliate-links ----
export const SetAffiliateLinksSchema = z.object({
  links: z.array(AffiliateLinkSchema),
});
export type SetAffiliateLinksInput = z.infer<typeof SetAffiliateLinksSchema>;

// ---- POST /interactions (engajamento) ----
export const ReceiveInteractionSchema = z.object({
  personaId: z.string(),
  platform: SocialPlatformSchema,
  externalId: z.string().min(1),
  text: z.string().min(1),
});
export type ReceiveInteractionInput = z.infer<typeof ReceiveInteractionSchema>;

// ---- POST /billing/checkout ----
export const CheckoutSchema = z.object({
  plan: z.enum(['FREE', 'STARTER', 'PRO', 'SCALE']),
});
export type CheckoutInput = z.infer<typeof CheckoutSchema>;

export interface InteractionDTO {
  id: string;
  personaId: string;
  platform: string;
  externalId: string;
  kind: string; // duvida | elogio | e_ia | spam | parceria
  inboundText: string;
  replyDraft: string | null;
  status: string; // RECEIVED | CLASSIFIED | REPLY_DRAFTED | ANSWERED | ROUTED
  createdAt: string;
}

// ---- POST /content/:id/approve ----
export const ApproveContentSchema = z.object({}).optional();

// ---- Sessão / auth (Sprint 1) ----
export const RoleSchema = z.enum(['OWNER', 'EDITOR', 'VIEWER']);
export interface MeResponse {
  userId: string;
  orgId: string;
  orgName: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  email: string;
  name: string | null;
}

// ---- Envelope de resposta padrão ----
export interface ApiOk<T> {
  ok: true;
  data: T;
}
export interface ApiErr {
  ok: false;
  error: { code: string; message: string; details?: unknown };
}
export type ApiResponse<T> = ApiOk<T> | ApiErr;

// Catálogo de nichos (o "leque" configurável) — resposta de GET /niches.
export interface NicheCatalogItem {
  slug: string;
  label: string;
  category: string;
  hashtags: string[];
  angle: string;
}
export interface NicheCatalog {
  all: NicheCatalogItem[];
  groups: { category: string; niches: NicheCatalogItem[] }[];
}

// Mapa de rotas do MVP (referência única).
export const API_ROUTES = {
  health: 'GET /health',
  me: 'GET /me',
  listNiches: 'GET /niches',
  receiveInteraction: 'POST /interactions',
  listInteractions: 'GET /interactions',
  autopilot: 'POST /content/autopilot',
  billing: 'GET /billing',
  checkout: 'POST /billing/checkout',
  listSocialAccounts: 'GET /social-accounts',
  approveContent: 'POST /content/:id/approve',
  getPersona: 'GET /personas/:id',
  updatePersona: 'PUT /personas/:id',
  uploadRefs: 'POST /personas/:id/refs',
  connectSocial: 'POST /social-accounts/connect',
  generateContent: 'POST /content/generate',
  listContent: 'GET /content',
  patchContent: 'PATCH /content/:id',
  scheduleContent: 'POST /content/:id/schedule',
  affiliateLinks: 'POST /content/:id/affiliate-links',
  analyticsOverview: 'GET /analytics/overview',
  ayrshareWebhook: 'POST /webhooks/ayrshare',
} as const;
