// Gates de segurança + compliance. Roda em imagem e texto antes de EM_REVISAO/APROVADO.
import type { ProviderResult } from '../types.js';

export interface SafetyCheckParams {
  text?: string;
  imageUrls?: string[];
  hasAffiliateLink: boolean;
}

export interface SafetyResult {
  verdict: 'pass' | 'flag' | 'block';
  reasons: string[];
  // compliance aplicado (ex.: #publi injetado, disclaimer de saúde exigido)
  complianceActions: string[];
}

export interface SafetyProvider {
  check(params: SafetyCheckParams): Promise<ProviderResult<SafetyResult>>;
}

// ============================================================
// B4 — Classificação de IMAGEM atrás de uma interface (ImageModerator).
//
// O gate de safety combina TEXTO (regras Conar/saúde abaixo) + IMAGEM (este moderador).
// Se a imagem for classificada 'unsafe' → verdict 'block'.
//
// MOCK: determinístico, sem chave — 'safe' a menos que a URL contenha um marcador de teste
// ('nsfw' / 'unsafe'). PLUGAR REAL: AWS Rekognition DetectModerationLabels ou OpenAI
// moderation por env (SAFETY_PROVIDER / chaves), trocando MockImageModerator pela impl real.
// ============================================================
export type ImageVerdict = 'safe' | 'unsafe';
export interface ImageModerationResult {
  verdict: ImageVerdict;
  labels: string[]; // rótulos de moderação encontrados (ex.: 'nudity', 'violence')
}
export interface ImageModerator {
  classify(imageUrls: string[]): Promise<ImageModerationResult>;
}

// Marcadores de teste para exercitar o caminho 'unsafe' de forma determinística no MVP.
const UNSAFE_URL_MARKERS = ['nsfw', 'unsafe', 'nude', 'explicit'];

export class MockImageModerator implements ImageModerator {
  async classify(imageUrls: string[]): Promise<ImageModerationResult> {
    const labels: string[] = [];
    for (const url of imageUrls) {
      const low = url.toLowerCase();
      for (const marker of UNSAFE_URL_MARKERS) {
        if (low.includes(marker)) labels.push(`mock:${marker}`);
      }
    }
    return { verdict: labels.length > 0 ? 'unsafe' : 'safe', labels };
  }
}

// PLUGAR REAL AQUI: ex.: AWS Rekognition / OpenAI moderation.
// Selecionado por env quando PROVIDER_SAFETY=real e a chave existir.
// export class RekognitionImageModerator implements ImageModerator { ... }

// Guardrails DUROS do kickoff B4 (bloqueiam = não podem ir a aprovado):
//  - afirmação médica (cura/trata/elimina doença) SEM disclaimer
//  - promessa de resultado garantido
const MEDICAL_PATTERNS = [/\bcura\b/i, /\btrata\b/i, /\bemagrece\s+\d/i, /\belimina\b.*\b(doen|gordura)/i];
const RESULT_PROMISE_PATTERNS = [
  /garant\w*.*resultad/i,
  /resultad\w*\s+garantid/i,
  /em\s+\d+\s+dias/i,
  /100%\s+(garantid|eficaz)/i,
];
// Presença de disclaimer rebaixa afirmação médica de "block" para "flag" (exige revisão humana).
const DISCLAIMER_PATTERNS = [/consulte.*(m[ée]dic|nutri)/i, /não substitui/i, /resultados? varia/i];

// ---- MOCK FUNCIONAL ---- (regras de compliance de TEXTO reais + classificador de IMAGEM mock)
export class MockSafetyProvider implements SafetyProvider {
  // O moderador de imagem é injetável: o RealSafetyProvider reaproveita o MESMO motor de texto
  // e troca apenas o moderador de imagem. Default mock.
  constructor(private readonly imageModerator: ImageModerator = new MockImageModerator()) {}

  async check(params: SafetyCheckParams): Promise<ProviderResult<SafetyResult>> {
    const reasons: string[] = [];
    const complianceActions: string[] = [];
    const text = params.text ?? '';

    const hasDisclaimer = DISCLAIMER_PATTERNS.some((re) => re.test(text));
    const medical = MEDICAL_PATTERNS.some((re) => re.test(text));
    const resultPromise = RESULT_PROMISE_PATTERNS.some((re) => re.test(text));

    let verdict: SafetyResult['verdict'] = 'pass';

    // Promessa de resultado em conteúdo monetizado = guardrail duro (bloqueia).
    if (resultPromise) {
      reasons.push('promessa-de-resultado');
      verdict = 'block';
    }
    // Afirmação médica: sem disclaimer = block; com disclaimer = flag (revisão humana).
    if (medical) {
      if (hasDisclaimer) {
        reasons.push('afirmacao-medica-com-disclaimer');
        if (verdict !== 'block') verdict = 'flag';
      } else {
        reasons.push('afirmacao-medica-sem-disclaimer');
        verdict = 'block';
      }
    }

    // Conteúdo com link de afiliado precisa de #publi (Conar). O pipeline (B3) já injeta;
    // aqui registramos a exigência caso o texto ainda não traga a hashtag.
    if (params.hasAffiliateLink && !/#publi/i.test(text)) {
      complianceActions.push('inject:#publi');
    }

    // Camada de IMAGEM (B4): combina com o veredito de texto. Imagem unsafe bloqueia.
    const imageUrls = params.imageUrls ?? [];
    let imageLabels: string[] = [];
    if (imageUrls.length > 0) {
      const mod = await this.imageModerator.classify(imageUrls);
      imageLabels = mod.labels;
      if (mod.verdict === 'unsafe') {
        reasons.push(`imagem-impropria:${mod.labels.join('|')}`);
        verdict = 'block';
      }
    }

    return {
      data: { verdict, reasons, complianceActions },
      costEstimateBRL: 0,
      raw: { mock: true, imageLabels },
    };
  }
}

// ---- REAL ---- (PLUGAR): mesmo motor de texto + ImageModerator real (Rekognition/OpenAI).
// Selecionado por env PROVIDER_SAFETY=real na fábrica. Como o motor de texto já é REAL,
// basta injetar um ImageModerator real quando a chave estiver disponível.
export class RealSafetyProvider extends MockSafetyProvider {
  constructor(imageModerator?: ImageModerator) {
    // TODO(real): trocar por RekognitionImageModerator quando SAFETY_PROVIDER apontar e houver chave.
    super(imageModerator ?? new MockImageModerator());
  }
}

// ============================================================
// B2 — Gate de consistência facial.
//
// Score de similaridade da imagem gerada vs refs APROVADAS da persona, limiar configurável
// (CONSISTENCY_THRESHOLD). Abaixo do limiar → descarta/flag (item REPROVADO).
// O embedding facial fica atrás de uma interface (FaceEmbedder); a impl real (Rekognition/
// face-api/CLIP) entra por env sem tocar o gate.
// ============================================================
export interface ConsistencyParams {
  imageUrl: string;
  faceRefUrls: string[];
  threshold: number;
}
export interface ConsistencyResult {
  score: number; // 0..1
  passed: boolean;
}
export interface ConsistencyProvider {
  score(params: ConsistencyParams): Promise<ProviderResult<ConsistencyResult>>;
}

// ---- Embedding facial atrás de interface ----
export interface FaceEmbedder {
  embed(imageUrl: string): Promise<number[]>;
}

// MOCK determinístico (sem chave/modelo de visão): deriva um vetor pseudo-aleatório do hash
// da URL. A MESMA URL produz SEMPRE o MESMO vetor → score reprodutível. Boa o suficiente para
// exercitar o gate ponta a ponta. PLUGAR REAL: AWS Rekognition (CompareFaces/SearchFaces),
// face-api.js ou CLIP — trocar esta impl por env, sem tocar RealConsistencyProvider.
const EMBED_DIM = 32;
export class MockFaceEmbedder implements FaceEmbedder {
  async embed(imageUrl: string): Promise<number[]> {
    // xorshift determinístico semeado pelo hash da URL.
    let seed = djb2(imageUrl) || 1;
    const v: number[] = [];
    for (let i = 0; i < EMBED_DIM; i++) {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      // normaliza para [-1, 1]
      v.push(((seed >>> 0) / 0xffffffff) * 2 - 1);
    }
    return l2normalize(v);
  }
}

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h | 0;
}
function l2normalize(v: number[]): number[] {
  const norm = Math.sqrt(v.reduce((a, x) => a + x * x, 0)) || 1;
  return v.map((x) => x / norm);
}
function cosine(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let dot = 0;
  for (let i = 0; i < n; i++) dot += a[i]! * b[i]!;
  return dot; // vetores já normalizados → produto interno = cosseno
}

// ---- MOCK ---- (compat Sprint 1): score estável a partir das refs, sem embedder.
export class MockConsistencyProvider implements ConsistencyProvider {
  async score(params: ConsistencyParams): Promise<ProviderResult<ConsistencyResult>> {
    // Sem refs aprovadas ainda → score neutro-alto (não barra o slice). Com refs → levemente melhor.
    const score = params.faceRefUrls.length > 0 ? 0.94 : 0.88;
    return {
      data: { score, passed: score >= params.threshold },
      costEstimateBRL: 0,
      raw: { mock: true, refs: params.faceRefUrls.length },
    };
  }
}

// ---- REAL ---- (B2): lógica real do gate; embedder injetável (mock por default).
// (a) obtém embedding da imagem e de cada ref aprovada via FaceEmbedder;
// (b) calcula a similaridade de cosseno MÉDIA contra as refs;
// (c) aplica o limiar (CONSISTENCY_THRESHOLD).
// Sem refs aprovadas: não há baseline a comparar → score neutro-alto (não barra; o operador
// aprova refs depois). Selecionado por env PROVIDER_CONSISTENCY=real na fábrica.
export class RealConsistencyProvider implements ConsistencyProvider {
  constructor(private readonly embedder: FaceEmbedder = new MockFaceEmbedder()) {}

  async score(params: ConsistencyParams): Promise<ProviderResult<ConsistencyResult>> {
    const refs = params.faceRefUrls;
    if (refs.length === 0) {
      const score = 0.88; // neutro-alto: sem baseline aprovado ainda.
      return {
        data: { score, passed: score >= params.threshold },
        costEstimateBRL: 0,
        raw: { real: true, refs: 0, note: 'sem-refs-aprovadas' },
      };
    }

    const imgEmb = await this.embedder.embed(params.imageUrl);
    const refEmbs = await Promise.all(refs.map((u) => this.embedder.embed(u)));
    const sims = refEmbs.map((r) => cosine(imgEmb, r));
    const mean = sims.reduce((a, x) => a + x, 0) / sims.length;
    // cosseno ∈ [-1,1] → mapeia para [0,1] para casar com o limiar 0..1.
    const score = Number(((mean + 1) / 2).toFixed(4));

    return {
      data: { score, passed: score >= params.threshold },
      costEstimateBRL: 0,
      raw: { real: true, refs: refs.length, sims },
    };
  }
}
