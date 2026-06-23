// MODEL: agregações para a Visão Geral (contagens reais da operação).
import { prisma } from './prisma.js';

export const AnalyticsModel = {
  async overviewCounts(orgId: string, personaId?: string) {
    const persona = personaId ? { personaId } : {};
    const [naFila, agendados, contasConectadas] = await Promise.all([
      prisma.contentItem.count({
        where: { orgId, ...persona, status: { in: ['GERADO', 'EM_REVISAO'] } },
      }),
      prisma.contentItem.count({
        where: { orgId, ...persona, status: { in: ['APROVADO', 'AGENDADO'] } },
      }),
      prisma.socialAccount.count({
        where: { persona: { orgId }, status: 'CONNECTED', ...(personaId ? { personaId } : {}) },
      }),
    ]);
    return { naFila, agendados, contasConectadas };
  },
};
