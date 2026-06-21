// MODEL: acesso a dados de ContentItem + Job. Queries escopadas por orgId.
import { prisma } from './prisma.js';
import type { Prisma } from '@prisma/client';

export const ContentModel = {
  create(data: Prisma.ContentItemUncheckedCreateInput) {
    return prisma.contentItem.create({ data });
  },

  findByIdInOrg(id: string, orgId: string) {
    return prisma.contentItem.findFirst({ where: { id, orgId } });
  },

  findById(id: string) {
    return prisma.contentItem.findUnique({ where: { id } });
  },

  listByOrg(orgId: string, filters: { status?: string; personaId?: string }) {
    return prisma.contentItem.findMany({
      where: {
        orgId,
        ...(filters.status ? { status: filters.status as Prisma.ContentItemWhereInput['status'] } : {}),
        ...(filters.personaId ? { personaId: filters.personaId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  update(id: string, data: Prisma.ContentItemUncheckedUpdateInput) {
    return prisma.contentItem.update({ where: { id }, data });
  },

  // Soma do custo de jobs da org nas últimas 24h (teto de gasto — guardrail de custo).
  async spentLast24h(orgId: string): Promise<number> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const agg = await prisma.job.aggregate({
      _sum: { costEstimate: true },
      where: { orgId, createdAt: { gte: since } },
    });
    return agg._sum.costEstimate ?? 0;
  },

  recordJob(data: Prisma.JobUncheckedCreateInput) {
    return prisma.job.create({ data });
  },

  findJob(where: Prisma.JobWhereInput) {
    return prisma.job.findFirst({ where });
  },
};
