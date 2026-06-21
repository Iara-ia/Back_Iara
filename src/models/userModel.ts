// MODEL: acesso a dados de User (usado pela resolução de sessão).
import { prisma } from './prisma.js';

export const UserModel = {
  findByIdWithOrg(id: string) {
    return prisma.user.findUnique({ where: { id }, include: { org: true } });
  },

  // fallback dev: primeiro owner do seed (fundador@iara.app).
  findSeedOwner() {
    return prisma.user.findFirst({ where: { email: 'fundador@iara.app' }, include: { org: true } });
  },
};
