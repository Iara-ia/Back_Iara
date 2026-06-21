// Interface provider-agnostic de LLM. Implementação real (MVP+): Claude (Anthropic / Bedrock).
import Anthropic from '@anthropic-ai/sdk';
import type { ProviderResult } from '../types.js';

export interface LlmGenerateParams {
  system: string; // system prompt da persona (personality.systemPrompt)
  prompt: string;
  model?: 'strategy' | 'volume'; // strategy=opus-4-8, volume=haiku-4-5
  maxTokens?: number;
  temperature?: number;
}

export interface LlmProvider {
  generateText(params: LlmGenerateParams): Promise<ProviderResult<string>>;
}

// ---- MOCK FUNCIONAL ----
// Gera legenda no tom da Isabella a partir do pilar/tema do prompt. Determinístico, sem chave.
const CTA_POOL = [
  'Salva esse post pra não esquecer 💛',
  'Me conta nos comentários o que achou!',
  'Compartilha com quem precisa ver isso ✨',
  'Bora colocar em prática hoje?',
];
const HASHTAG_POOL: Record<string, string[]> = {
  saude: ['#saude', '#bemestar', '#nutricao', '#vidaleve'],
  moda: ['#moda', '#look', '#estilo', '#ootd'],
  beleza: ['#beleza', '#skincare', '#autocuidado'],
  viagens: ['#viagem', '#trip', '#destinos'],
  lifestyle: ['#lifestyle', '#rotina', '#diaadia'],
};

export class MockLlmProvider implements LlmProvider {
  async generateText(params: LlmGenerateParams): Promise<ProviderResult<string>> {
    // Extrai o pilar do prompt (formato livre: "pilar: saude | tema: ...").
    const pilarMatch = /pilar:\s*([a-zçãéíóú_]+)/i.exec(params.prompt);
    const pilar = (pilarMatch?.[1] ?? 'lifestyle').toLowerCase();
    const tags = (HASHTAG_POOL[pilar] ?? HASHTAG_POOL.lifestyle)!.join(' ');
    const cta = CTA_POOL[params.prompt.length % CTA_POOL.length];

    const caption =
      `Oi, gente! 💛 Hoje vim falar de ${pilar} de um jeito leve e real. ` +
      `Pequenos passos no dia a dia fazem toda a diferença — sem pressão, no seu tempo. ` +
      `${cta}\n\n` +
      `🤖 Conteúdo gerado por IA. ${tags}`;

    return {
      data: caption,
      // ~R$ 0,03 por legenda no modelo de volume (haiku).
      costEstimateBRL: params.model === 'strategy' ? 0.18 : 0.03,
      raw: { mock: true, model: params.model ?? 'volume', pilar },
    };
  }
}

// ---- REAL: Claude (Anthropic) ----
// Preço por 1M tokens (USD). strategy=opus (ideação/estratégia), volume=haiku (legendas em escala).
const PRICING_USD: Record<string, { in: number; out: number }> = {
  'claude-haiku-4-5': { in: 1, out: 5 },
  'claude-sonnet-4-6': { in: 3, out: 15 },
  'claude-opus-4-8': { in: 5, out: 25 },
};

export class ClaudeLlmProvider implements LlmProvider {
  private client: Anthropic | null = null;

  private getClient(): Anthropic {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error(
        'ClaudeLlmProvider: defina ANTHROPIC_API_KEY (ou use PROVIDER_LLM=mock).',
      );
    }
    if (!this.client) this.client = new Anthropic();
    return this.client;
  }

  async generateText(params: LlmGenerateParams): Promise<ProviderResult<string>> {
    const client = this.getClient();
    const model =
      params.model === 'strategy'
        ? process.env.LLM_MODEL_STRATEGY ?? 'claude-opus-4-8'
        : process.env.LLM_MODEL_VOLUME ?? 'claude-haiku-4-5';

    const res = await client.messages.create({
      model,
      max_tokens: params.maxTokens ?? 600,
      system: params.system,
      messages: [{ role: 'user', content: params.prompt }],
    });

    if (res.stop_reason === 'refusal') {
      throw new Error('ClaudeLlmProvider: requisição recusada pelo classificador de segurança.');
    }

    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();

    const fx = Number(process.env.FX_USD_BRL ?? '5.40');
    const price = PRICING_USD[model] ?? PRICING_USD['claude-haiku-4-5']!;
    const costUSD =
      (res.usage.input_tokens / 1e6) * price.in +
      (res.usage.output_tokens / 1e6) * price.out;

    return {
      data: text,
      costEstimateBRL: Number((costUSD * fx).toFixed(4)),
      raw: { model, usage: res.usage, stop_reason: res.stop_reason },
    };
  }
}
