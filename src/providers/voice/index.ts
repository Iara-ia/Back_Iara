// Interface provider-agnostic de voz (V1 — ElevenLabs). Definida agora; não usada no MVP.
import type { ProviderResult } from '../types.js';

export interface VoiceSynthParams {
  text: string;
  voiceId: string;
}
export interface VoiceProvider {
  synthesize(params: VoiceSynthParams): Promise<ProviderResult<{ url: string }>>;
}

export class StubVoiceProvider implements VoiceProvider {
  async synthesize(): Promise<ProviderResult<{ url: string }>> {
    return {
      data: { url: 'https://example.com/stub.mp3' },
      costEstimateBRL: 0,
      raw: { stub: true, notice: 'voz é V1, fora do MVP' },
    };
  }
}
