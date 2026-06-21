// Interface provider-agnostic de vídeo (V1 — Runway/Kling). Definida agora; não usada no MVP.
import type { ProviderResult } from '../types.js';

export interface VideoGenerateParams {
  imageUrl: string; // anima a imagem estática da persona
  prompt?: string;
  durationSec?: number;
}
export interface GeneratedVideo {
  url: string;
  durationSec: number;
}
export interface VideoProvider {
  generate(params: VideoGenerateParams): Promise<ProviderResult<GeneratedVideo>>;
}

export class StubVideoProvider implements VideoProvider {
  async generate(params: VideoGenerateParams): Promise<ProviderResult<GeneratedVideo>> {
    return {
      data: { url: 'https://example.com/stub.mp4', durationSec: params.durationSec ?? 5 },
      costEstimateBRL: 0,
      raw: { stub: true, notice: 'video é V1, fora do MVP' },
    };
  }
}
