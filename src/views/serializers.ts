// VIEW: serializers Prisma → DTO (contratos estáveis entre front e back).
// A camada de view decide a forma exata da resposta (datas em ISO, defaults, etc.).
import type {
  PersonaDTO,
  ContentItemDTO,
  SocialAccountDTO,
  VisualProfile,
  Personality,
  Asset,
  AffiliateLink,
  QaFlags,
} from '../models/dto.js';

/* eslint-disable @typescript-eslint/no-explicit-any */
export function toPersonaDTO(p: any): PersonaDTO {
  return {
    id: p.id,
    orgId: p.orgId,
    name: p.name,
    bio: p.bio ?? null,
    niches: p.niches ?? [],
    language: p.language,
    status: p.status,
    visualProfile: (p.visualProfile ?? { loraId: null, faceRefs: [], paleta: [] }) as VisualProfile,
    personality: (p.personality ?? {
      systemPrompt: '',
      tom: '',
      do: [],
      dont: [],
    }) as Personality,
    aiDisclosure: p.aiDisclosure,
    createdAt: p.createdAt.toISOString(),
  };
}

export function toContentItemDTO(c: any): ContentItemDTO {
  return {
    id: c.id,
    orgId: c.orgId,
    personaId: c.personaId,
    type: c.type,
    pilar: c.pilar ?? null,
    status: c.status,
    assets: (c.assets ?? []) as Asset[],
    caption: c.caption ?? null,
    hashtags: c.hashtags ?? [],
    cta: c.cta ?? null,
    affiliateLinks: (c.affiliateLinks ?? []) as AffiliateLink[],
    qaFlags: (c.qaFlags ?? null) as QaFlags | null,
    scheduleAt: c.scheduleAt ? c.scheduleAt.toISOString() : null,
    platforms: c.platforms ?? [],
    externalPostIds: (c.externalPostIds ?? null) as Record<string, string> | null,
    approvedBy: c.approvedBy ?? null,
    approvedAt: c.approvedAt ? c.approvedAt.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
  };
}

export function toSocialAccountDTO(s: any): SocialAccountDTO {
  return {
    id: s.id,
    personaId: s.personaId,
    platform: s.platform,
    handle: s.handle,
    status: s.status,
    createdAt: s.createdAt.toISOString(),
  };
}
