// Ponto único de acesso aos providers. Trocar implementação = trocar a seleção por env (sem tocar callers).
//
// Seleção por variável de ambiente (Sprint 1):
//   PROVIDER_IMAGE=mock|flux          (default: mock)
//   PROVIDER_LLM=mock|claude          (default: mock)
//   PROVIDER_DISTRIBUTION=mock|ayrshare (default: mock)
//   PROVIDER_SAFETY=mock|real         (default: mock)
//   PROVIDER_CONSISTENCY=mock|real    (default: mock)
//
// Os MOCKs são funcionais e determinísticos (rodam sem nenhuma chave de API).
// As implementações reais (Flux/Claude/Ayrshare) ficam atrás da MESMA interface;
// hoje lançam erro pedindo a chave. Plugue-as nos arquivos *Real* de cada subpasta.
export * from './types.js';
export * from './llm/index.js';
export * from './image/index.js';
export * from './video/index.js';
export * from './voice/index.js';
export * from './distribution/index.js';
export * from './safety/index.js';

import { MockLlmProvider, ClaudeLlmProvider, type LlmProvider } from './llm/index.js';
import { MockImageProvider, FluxImageProvider, type ImageProvider } from './image/index.js';
import { StubVideoProvider, type VideoProvider } from './video/index.js';
import { StubVoiceProvider, type VoiceProvider } from './voice/index.js';
import {
  MockDistributionProvider,
  AyrshareDistributionProvider,
  type DistributionProvider,
} from './distribution/index.js';
import {
  MockSafetyProvider,
  RealSafetyProvider,
  MockConsistencyProvider,
  RealConsistencyProvider,
  type SafetyProvider,
  type ConsistencyProvider,
} from './safety/index.js';

export interface Providers {
  llm: LlmProvider;
  image: ImageProvider;
  video: VideoProvider;
  voice: VoiceProvider;
  distribution: DistributionProvider;
  safety: SafetyProvider;
  consistency: ConsistencyProvider;
}

function env(key: string, fallback: string): string {
  return (process.env[key] ?? fallback).toLowerCase();
}

// Fábrica MVP: mock por padrão; troca para real quando a env apontar e a chave existir.
export function createProviders(): Providers {
  const image =
    env('PROVIDER_IMAGE', 'mock') === 'flux' ? new FluxImageProvider() : new MockImageProvider();

  const llm =
    env('PROVIDER_LLM', 'mock') === 'claude' ? new ClaudeLlmProvider() : new MockLlmProvider();

  const distribution =
    env('PROVIDER_DISTRIBUTION', 'mock') === 'ayrshare'
      ? new AyrshareDistributionProvider()
      : new MockDistributionProvider();

  // B4 — safety: motor de texto sempre REAL; camada de imagem mock|real (Rekognition/OpenAI).
  const safety =
    env('PROVIDER_SAFETY', 'mock') === 'real' ? new RealSafetyProvider() : new MockSafetyProvider();

  // B2 — consistência facial: mock (score estável) | real (embedding de cosseno vs refs).
  const consistency =
    env('PROVIDER_CONSISTENCY', 'mock') === 'real'
      ? new RealConsistencyProvider()
      : new MockConsistencyProvider();

  // Vídeo/voz (Reel): stub determinístico (sem chave). Real (Runway/Kling + ElevenLabs)
  // entra atrás da mesma interface quando houver PROVIDER_VIDEO/VOICE + chave.
  const video = new StubVideoProvider();
  const voice = new StubVoiceProvider();

  return { llm, image, video, voice, distribution, safety, consistency };
}

// Diagnóstico: quais providers estão ativos (para logar no boot do worker/api).
export function providersInfo(): Record<string, string> {
  return {
    image: env('PROVIDER_IMAGE', 'mock'),
    llm: env('PROVIDER_LLM', 'mock'),
    distribution: env('PROVIDER_DISTRIBUTION', 'mock'),
    safety: env('PROVIDER_SAFETY', 'mock'),
    consistency: env('PROVIDER_CONSISTENCY', 'mock'),
  };
}
