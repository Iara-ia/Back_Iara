// MODEL: Interaction (engajamento). Comentários/DMs recebidos → resposta gerada.
import { prisma } from './prisma.js';
import type { Prisma } from '@prisma/client';

export const InteractionModel = {
  create(data: Prisma.InteractionUncheckedCreateInput) {
    return prisma.interaction.create({ data });
  },
  listByOrg(orgId: string) {
    return prisma.interaction.findMany({
      where: { persona: { orgId } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  },
  personaInOrg(personaId: string, orgId: string) {
    return prisma.persona.findFirst({ where: { id: personaId, orgId } });
  },
};
