// MODEL: agregações para a Visão Geral (contagens reais da operação).
import { prisma } from './prisma.js';

export const AnalyticsModel = {
  async overviewCounts(orgId: string) {
    const [naFila, agendados, contasConectadas] = await Promise.all([
      prisma.contentItem.count({ where: { orgId, status: { in: ['GERADO', 'EM_REVISAO'] } } }),
      prisma.contentItem.count({ where: { orgId, status: { in: ['APROVADO', 'AGENDADO'] } } }),
      prisma.socialAccount.count({ where: { persona: { orgId }, status: 'CONNECTED' } }),
    ]);
    return { naFila, agendados, contasConectadas };
  },
};
