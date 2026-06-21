// Seed mínimo: 1 org + 1 user owner + a persona Isabella (single-persona do MVP).
// Fonte da persona: Isabella_Souza_Virtual_Influencer_Documentacao_Completa.docx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.org.upsert({
    where: { id: 'org_iara_seed' },
    update: {},
    create: { id: 'org_iara_seed', name: 'IARA (operação própria)' },
  });

  // id fixo do owner (como org/persona) para o front apontar NEXT_PUBLIC_DEV_USER_ID
  // de forma estável entre re-seeds — sem isso a Fila abre vazia (401) na demo.
  // upsert por email NÃO troca o id de um registro já existente; então, se houver um
  // owner com o email mas id diferente, normalizamos para o id fixo (idempotente).
  const OWNER_ID = 'user_fundador_seed';
  const existing = await prisma.user.findUnique({ where: { email: 'fundador@iara.app' } });
  if (existing && existing.id !== OWNER_ID) {
    // approvedBy é string solta (não FK); re-aponta os itens já aprovados para o id novo.
    await prisma.contentItem.updateMany({
      where: { approvedBy: existing.id },
      data: { approvedBy: OWNER_ID },
    });
    await prisma.user.delete({ where: { id: existing.id } });
  }
  await prisma.user.upsert({
    where: { id: OWNER_ID },
    update: { orgId: org.id, email: 'fundador@iara.app', name: 'Fundador', role: 'OWNER' },
    create: {
      id: OWNER_ID,
      orgId: org.id,
      email: 'fundador@iara.app',
      name: 'Fundador',
      role: 'OWNER',
    },
  });

  await prisma.persona.upsert({
    where: { id: 'persona_isabella' },
    update: {},
    create: {
      id: 'persona_isabella',
      orgId: org.id,
      name: 'Isabella Souza',
      bio: 'Nutricionista (USP) · saúde, moda, beleza, viagens e lifestyle. Conteúdo gerado por IA. 🤖',
      niches: ['saude', 'moda', 'beleza', 'viagens', 'lifestyle'],
      language: 'pt-BR',
      status: 'DRAFT',
      aiDisclosure: true,
      visualProfile: {
        loraId: null,
        faceRefs: [],
        paleta: ['#C2683E', '#D9B8A0', '#7A7E52'], // terracota / nude / oliva
      },
      personality: {
        systemPrompt:
          'Você é a Isabella Souza, influenciadora virtual brasileira de 26 anos, nutricionista. ' +
          'Tom próximo, motivador e transparente sobre ser uma IA. Português brasileiro informal.',
        tom: 'próximo, motivador, transparente',
        do: ['ser acolhedora', 'declarar que é IA quando perguntada', 'usar #publi em parcerias'],
        dont: ['afirmação médica sem disclaimer', 'promessa de resultado em publi'],
      },
    },
  });

  console.log('Seed OK: org + user + persona Isabella');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
