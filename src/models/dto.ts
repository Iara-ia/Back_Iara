// Tipos de domínio (subconjunto serializável das entidades do Prisma).
// São a "forma" que os models/serializers retornam; usados pelos contratos de API.
// Não dependem do runtime do Prisma (seguros para compartilhar com o front).
import type {
  Role,
  PersonaStatus,
  ContentStatus,
  ContentType,
  SocialPlatform,
  AccountStatus,
  JobType,
  JobStatus,
  MonetizationSource,
} from '../lib/enums.js';

export interface FaceRef {
  url: string;
  approved: boolean;
}

export interface VisualProfile {
  loraId: string | null;
  faceRefs: FaceRef[];
  paleta: string[]; // hex
}

export interface Personality {
  systemPrompt: string;
  tom: string;
  do: string[];
  dont: string[];
}

export interface Asset {
  kind: 'image' | 'video' | 'audio';
  url: string;
  width?: number;
  height?: number;
}

export interface AffiliateLink {
  url: string;
  network: string; // amazon | hotmart | magalu | awin | outro
  utm?: string;
  cupom?: string;
}

export interface QaFlags {
  consistencyScore?: number; // 0..1 vs refs aprovadas
  safety?: 'pass' | 'flag' | 'block';
  compliance?: string[]; // ex: ['#publi-injetado', 'disclaimer-saude']
}

export interface PersonaDTO {
  id: string;
  orgId: string;
  name: string;
  bio: string | null;
  niches: string[];
  language: string;
  status: PersonaStatus;
  visualProfile: VisualProfile;
  personality: Personality;
  aiDisclosure: boolean;
  createdAt: string;
}

export interface SocialAccountDTO {
  id: string;
  personaId: string;
  platform: SocialPlatform;
  handle: string;
  status: AccountStatus;
  createdAt: string;
}

export interface ContentItemDTO {
  id: string;
  orgId: string;
  personaId: string;
  type: ContentType;
  pilar: string | null;
  status: ContentStatus;
  assets: Asset[];
  caption: string | null;
  hashtags: string[];
  cta: string | null;
  affiliateLinks: AffiliateLink[];
  qaFlags: QaFlags | null;
  scheduleAt: string | null;
  platforms: SocialPlatform[];
  externalPostIds: Record<string, string> | null;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
}

export interface JobDTO {
  id: string;
  type: JobType;
  status: JobStatus;
  costEstimate: number;
  attempts: number;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsOverviewDTO {
  followers: number;
  reach: number;
  engagementRate: number;
  perPost: Array<{
    contentItemId: string;
    reach: number;
    likes: number;
    comments: number;
  }>;
}

export interface UserSession {
  userId: string;
  orgId: string;
  role: Role;
}

export type { MonetizationSource };
