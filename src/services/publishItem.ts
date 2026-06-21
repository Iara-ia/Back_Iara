// ============================================================
// SERVICE (Sprint 3) — Publicação de UM ContentItem (roda no worker via job atrasado).
//
// Quando o agendamento vence, o worker chama `publishOneContentItem({ contentItemId })`,
// que envia o item ao provider de distribuição (mock|ayrshare) e marca PUBLICADO com os
// externalPostIds. Idempotente: se o item já não estiver AGENDADO, no-op.
// ============================================================
import { prisma } from '../models/prisma.js';
import { createProviders } from '../providers/index.js';
import type { Asset } from '../models/dto.js';
import type { SocialPlatform } from '../lib/enums.js';

const providers = createProviders();

export async function publishOneContentItem({ contentItemId }: { contentItemId: string }) {
  const item = await prisma.contentItem.findUnique({ where: { id: contentItemId } });
  if (!item) return null;

  // Idempotência: só publica item AGENDADO (passou pelos gates + foi agendado).
  if (item.status !== 'AGENDADO') return item;

  const platforms = (item.platforms ?? []) as SocialPlatform[];
  const mediaUrls = ((item.assets ?? []) as unknown as Asset[]).map((a) => a.url).filter(Boolean);

  const res = await providers.distribution.publish({
    caption: item.caption ?? '',
    mediaUrls,
    platforms,
  });

  return prisma.contentItem.update({
    where: { id: item.id },
    data: {
      status: 'PUBLICADO',
      externalPostIds: res.data.externalPostIds as object,
    },
  });
}
