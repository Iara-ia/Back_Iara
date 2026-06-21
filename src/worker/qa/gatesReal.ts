// QA: gates REAIS isolados (B2 consistência real, B4 safety real) — sem geração, chamando
// os providers diretamente. Roda com PROVIDER_CONSISTENCY=real PROVIDER_SAFETY=real (do shell).
import { createProviders, providersInfo, RealConsistencyProvider, RealSafetyProvider } from '../../providers/index.js';

console.log('providersInfo:', JSON.stringify(providersInfo()));
const p = createProviders();
console.log('safety é RealSafetyProvider:', p.safety instanceof RealSafetyProvider);
console.log('consistency é RealConsistencyProvider:', p.consistency instanceof RealConsistencyProvider);

const THRESHOLD = Number(process.env.CONSISTENCY_THRESHOLD ?? 0.8);

// ---- B4: imagem 'nsfw' marcada → verdict block ----
const safeImg = await p.safety.check({ text: 'Look leve de verão 💛 #moda', imageUrls: ['https://placehold.co/512/safe.png'], hasAffiliateLink: false });
const nsfwImg = await p.safety.check({ text: 'Look leve de verão 💛 #moda', imageUrls: ['https://cdn.x/nsfw-foto.png'], hasAffiliateLink: false });
console.log('\n[B4] imagem SAFE  →', JSON.stringify(safeImg.data));
console.log('[B4] imagem NSFW  →', JSON.stringify(nsfwImg.data));

// ---- B4: texto compliance (promessa de resultado / afirmação médica sem disclaimer) ----
const medSem = await p.safety.check({ text: 'esse chá cura ansiedade em 7 dias, resultado garantido', hasAffiliateLink: false });
const medCom = await p.safety.check({ text: 'esse chá ajuda no bem-estar; não substitui acompanhamento, consulte seu médico', hasAffiliateLink: false });
console.log('[B4] texto medico SEM disclaimer →', JSON.stringify(medSem.data));
console.log('[B4] texto medico COM disclaimer →', JSON.stringify(medCom.data));

// ---- B2: consistência real (cosseno de embeddings) ----
// refs aprovadas da persona do seed. Imagem igual a uma ref → cosseno alto (passa).
// Imagem com URL bem diferente → cosseno baixo (REPROVA, abaixo do limiar).
const refs = [
  'https://placehold.co/512x512/C2683E/FBF7F2/png?text=Ref',
  'https://placehold.co/512',
  'https://placehold.co/512x512/D9B8A0/FBF7F2/png?text=Ref2',
];
const consMatch = await p.consistency.score({ imageUrl: refs[0]!, faceRefUrls: refs, threshold: THRESHOLD });
const consFar   = await p.consistency.score({ imageUrl: 'https://exemplo.com/uma-imagem-totalmente-outra-pessoa.png', faceRefUrls: refs, threshold: THRESHOLD });
const consNoRef = await p.consistency.score({ imageUrl: refs[0]!, faceRefUrls: [], threshold: THRESHOLD });
console.log('\n[B2] threshold =', THRESHOLD);
console.log('[B2] imagem == ref aprovada →', JSON.stringify(consMatch.data), 'raw:', JSON.stringify(consMatch.raw));
console.log('[B2] imagem distante das refs →', JSON.stringify(consFar.data), 'raw:', JSON.stringify(consFar.raw));
console.log('[B2] sem refs aprovadas       →', JSON.stringify(consNoRef.data), 'raw:', JSON.stringify(consNoRef.raw));

console.log('\n=== VEREDITO GATES REAIS ===');
console.log('B4 nsfw bloqueia:', nsfwImg.data.verdict === 'block');
console.log('B4 promessa+medico bloqueia:', medSem.data.verdict === 'block');
console.log('B4 medico c/ disclaimer = flag:', medCom.data.verdict === 'flag');
console.log('B2 match passa:', consMatch.data.passed === true);
console.log('B2 distante REPROVA (abaixo do limiar):', consFar.data.passed === false);
process.exit(0);
