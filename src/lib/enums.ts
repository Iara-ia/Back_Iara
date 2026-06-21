// Enums de status do domínio — espelham o schema Prisma (prisma/schema.prisma).
// Mantidos como const-objects (fonte de verdade compartilhada com o front via cópia vendorada).

export const Role = {
  OWNER: 'OWNER',
  EDITOR: 'EDITOR',
  VIEWER: 'VIEWER',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const PersonaStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
} as const;
export type PersonaStatus = (typeof PersonaStatus)[keyof typeof PersonaStatus];

// Fluxo de status do ContentItem — ordem importa para o kanban (HITL).
export const ContentStatus = {
  RASCUNHO: 'RASCUNHO',
  GERADO: 'GERADO',
  EM_REVISAO: 'EM_REVISAO',
  APROVADO: 'APROVADO',
  AGENDADO: 'AGENDADO',
  PUBLICADO: 'PUBLICADO',
  FALHOU: 'FALHOU',
  REPROVADO: 'REPROVADO',
} as const;
export type ContentStatus = (typeof ContentStatus)[keyof typeof ContentStatus];

export const KANBAN_COLUMNS: ContentStatus[] = [
  ContentStatus.GERADO,
  ContentStatus.EM_REVISAO,
  ContentStatus.APROVADO,
];

export const ContentType = {
  POST: 'POST',
  REEL: 'REEL',
  STORY: 'STORY',
  BLOG: 'BLOG',
} as const;
export type ContentType = (typeof ContentType)[keyof typeof ContentType];

export const SocialPlatform = {
  INSTAGRAM: 'INSTAGRAM',
  TIKTOK: 'TIKTOK',
  YOUTUBE: 'YOUTUBE',
} as const;
export type SocialPlatform = (typeof SocialPlatform)[keyof typeof SocialPlatform];

export const AccountStatus = {
  CONNECTED: 'CONNECTED',
  ERROR: 'ERROR',
  EXPIRED: 'EXPIRED',
} as const;
export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus];

export const JobType = {
  GEN_IMAGE: 'GEN_IMAGE',
  CONSISTENCY_GATE: 'CONSISTENCY_GATE',
  GEN_CAPTION: 'GEN_CAPTION',
  SAFETY_GATE: 'SAFETY_GATE',
  PUBLISH: 'PUBLISH',
  FETCH_INSIGHTS: 'FETCH_INSIGHTS',
} as const;
export type JobType = (typeof JobType)[keyof typeof JobType];

export const JobStatus = {
  QUEUED: 'QUEUED',
  RUNNING: 'RUNNING',
  DONE: 'DONE',
  FAILED: 'FAILED',
} as const;
export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

export const MonetizationSource = {
  AFFILIATE: 'AFFILIATE',
  BRAND_DEAL: 'BRAND_DEAL',
  SUBSCRIPTION: 'SUBSCRIPTION',
  ADSENSE: 'ADSENSE',
  OTHER: 'OTHER',
} as const;
export type MonetizationSource = (typeof MonetizationSource)[keyof typeof MonetizationSource];
