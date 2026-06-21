// MODEL: acesso a dados de SocialAccount. Escopado por org via relação persona.org.
import { prisma } from './prisma.js';
import type { Prisma, SocialPlatform } from '@prisma/client';

export const SocialModel = {
  listByOrg(orgId: string) {
    return prisma.socialAccount.findMany({
      where: { persona: { orgId } },
      orderBy: { createdAt: 'desc' },
    });
  },

  findInOrg(personaId: string, platform: SocialPlatform, orgId: string) {
    return prisma.socialAccount.findFirst({
      where: { personaId, platform, persona: { orgId } },
    });
  },

  update(id: string, data: Prisma.SocialAccountUpdateInput) {
    return prisma.socialAccount.update({ where: { id }, data });
  },

  create(data: Prisma.SocialAccountUncheckedCreateInput) {
    return prisma.socialAccount.create({ data });
  },
};
