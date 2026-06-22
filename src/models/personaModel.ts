// MODEL: acesso a dados de Persona. Toda query é escopada por orgId (isolamento multi-tenant).
import { prisma } from './prisma.js';
import type { Prisma } from '@prisma/client';

export const PersonaModel = {
  listByOrg(orgId: string) {
    return prisma.persona.findMany({ where: { orgId }, orderBy: { createdAt: 'asc' } });
  },

  findByIdInOrg(id: string, orgId: string) {
    return prisma.persona.findFirst({ where: { id, orgId } });
  },

  create(data: Prisma.PersonaUncheckedCreateInput) {
    return prisma.persona.create({ data });
  },

  update(id: string, data: Prisma.PersonaUpdateInput) {
    return prisma.persona.update({ where: { id }, data });
  },
};
