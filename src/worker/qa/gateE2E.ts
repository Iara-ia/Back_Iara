// QA Sprint 2 — prova END-TO-END do gate de consistência REAL no pipeline:
// (1) injeta refs aprovadas na persona (para o gate ter baseline);
// (2) cria um ContentItem GERADO e roda generateOneContentItem com PROVIDER_CONSISTENCY=real;
// (3) confirma que o item foi marcado REPROVADO com reason 'consistencia-abaixo-do-limiar'
//     e que o Job CONSISTENCY_GATE ficou FAILED.
// Depois RESTAURA a persona (refs vazias). Roda com PROVIDER_CONSISTENCY=real do shell.
import { prisma } from '../../models/index.js';
import { generateOneContentItem } from '../../services/index.js';
import { providersInfo } from '../../providers/index.js';

console.log('providersInfo:', JSON.stringify(providersInfo()));

const persona = await prisma.persona.findUniqueOrThrow({ where: { id: 'persona_isabella' } });
const originalVisual = persona.visualProfile;

// injeta refs aprovadas (urls arbitrárias; o gate real compara o embedding da imagem gerada
// contra elas — imagem mock terá url diferente → cosseno baixo → REPROVA).
await prisma.persona.update({
  where: { id: 'persona_isabella' },
  data: {
    visualProfile: {
      loraId: null,
      paleta: ['#C2683E'],
      faceRefs: [
        { url: 'https://refs.iara/isabella-aprovada-1.png', approved: true },
        { url: 'https://refs.iara/isabella-aprovada-2.png', approved: true },
      ],
    } as object,
  },
});

const item = await prisma.contentItem.create({
  data: { orgId: 'org_iara_seed', personaId: 'persona_isabella', type: 'POST', pilar: 'beleza', status: 'GERADO', assets: [], hashtags: [], platforms: [] },
});
console.log('item criado GERADO:', item.id);

const result = await generateOneContentItem({ contentItemId: item.id });
console.log('status final:', result.status);
console.log('qaFlags:', JSON.stringify(result.qaFlags));

const consJob = await prisma.job.findFirst({ where: { contentItemId: item.id, type: 'CONSISTENCY_GATE' } });
console.log('CONSISTENCY_GATE job status:', consJob?.status, 'logs:', JSON.stringify(consJob?.logs));

console.log('\n=== VEREDITO B2 E2E ===');
console.log('item REPROVADO:', result.status === 'REPROVADO');
console.log('reason consistencia:', (result.qaFlags as any)?.reason);
console.log('job CONSISTENCY_GATE FAILED:', consJob?.status === 'FAILED');

// restaura persona
await prisma.persona.update({ where: { id: 'persona_isabella' }, data: { visualProfile: originalVisual as object } });
console.log('persona restaurada (refs originais).');
process.exit(0);
