// Interface provider-agnostic de geração de imagem com face-lock.
// Implementação real (MVP+): Flux (Replicate/Fal) com LoRA/refs da persona.
import type { ProviderResult } from '../types.js';

export interface ImageGenerateParams {
  prompt: string;
  loraId: string | null;
  faceRefUrls: string[];
  count: number;
  width?: number;
  height?: number;
  seed?: number; // determinismo do mock
}

export interface GeneratedImage {
  url: string;
  width: number;
  height: number;
}

export interface ImageProvider {
  generate(params: ImageGenerateParams): Promise<ProviderResult<GeneratedImage[]>>;
}

// Hash determinístico simples (djb2) — mock gera o MESMO placeholder para o mesmo prompt.
function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return Math.abs(h >>> 0);
}

// ---- MOCK FUNCIONAL ----
// Retorna placeholders determinísticos. Sem chave, sem rede de saída obrigatória.
// Custo estimado simbólico para exercitar Job.costEstimate e os tetos de gasto.
export class MockImageProvider implements ImageProvider {
  async generate(params: ImageGenerateParams): Promise<ProviderResult<GeneratedImage[]>> {
    const w = params.width ?? 1024;
    const h = params.height ?? 1024;
    const base = djb2(`${params.prompt}|${params.loraId ?? 'no-lora'}|${params.seed ?? 0}`);
    const images: GeneratedImage[] = Array.from({ length: params.count }, (_, i) => {
      const tone = ['C2683E', 'D9B8A0', '7A7E52', 'E8A85C'][(base + i) % 4];
      const label = encodeURIComponent(`Isabella ${(base % 1000) + i}`);
      return {
        url: `https://placehold.co/${w}x${h}/${tone}/FBF7F2/png?text=${label}`,
        width: w,
        height: h,
      };
    });
    // ~R$ 0,12 por imagem (estimativa de Flux dev) — alimenta o teto diário.
    return {
      data: images,
      costEstimateBRL: Number((0.12 * params.count).toFixed(2)),
      raw: { mock: true, seedBase: base },
    };
  }
}

// ---- REAL: Flux (Replicate/Fal) ----
// PLUGAR AQUI: usar REPLICATE_API_TOKEN/FAL_API_KEY + FLUX_MODEL e o loraId da persona.
export class FluxImageProvider implements ImageProvider {
  async generate(_params: ImageGenerateParams): Promise<ProviderResult<GeneratedImage[]>> {
    const token = process.env.REPLICATE_API_TOKEN || process.env.FAL_API_KEY;
    if (!token) {
      throw new Error(
        'FluxImageProvider: defina REPLICATE_API_TOKEN ou FAL_API_KEY (ou use PROVIDER_IMAGE=mock).',
      );
    }
    // TODO(Sprint real): chamar a API do Flux, fazer poll do resultado, baixar e subir ao storage.
    throw new Error('FluxImageProvider ainda não implementado — plugue a chamada real aqui.');
  }
}
