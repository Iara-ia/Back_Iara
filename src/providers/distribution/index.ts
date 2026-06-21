// Interface provider-agnostic de distribuição multi-rede. Implementação real (MVP+): Ayrshare.
import type { ProviderResult } from '../types.js';
import type { SocialPlatform } from '../../lib/enums.js';

export interface PublishParams {
  caption: string;
  mediaUrls: string[];
  platforms: SocialPlatform[];
  scheduleAt?: string; // ISO; ausente = publica já
}

export interface PublishResult {
  externalPostIds: Partial<Record<Lowercase<SocialPlatform>, string>>;
}

export interface InsightsResult {
  followers: number;
  reach: number;
  likes: number;
  comments: number;
}

// Resultado de "conectar conta" — no real, o Ayrshare devolve um profileKey por perfil.
export interface ConnectResult {
  profileKey: string; // token/identificador do perfil conectado (será criptografado e salvo)
  status: 'CONNECTED' | 'ERROR' | 'EXPIRED';
}

export interface DistributionProvider {
  connect(platform: SocialPlatform, handle: string): Promise<ProviderResult<ConnectResult>>;
  publish(params: PublishParams): Promise<ProviderResult<PublishResult>>;
  fetchInsights(
    externalPostId: string,
    platform: SocialPlatform,
  ): Promise<ProviderResult<InsightsResult>>;
}

// ---- MOCK FUNCIONAL ----
// Simula o fluxo de conexão (gera um profileKey determinístico) e a publicação.
export class MockDistributionProvider implements DistributionProvider {
  async connect(
    platform: SocialPlatform,
    handle: string,
  ): Promise<ProviderResult<ConnectResult>> {
    const profileKey = `mock_${platform.toLowerCase()}_${handle.replace(/[^a-z0-9]/gi, '')}`;
    return {
      data: { profileKey, status: 'CONNECTED' },
      costEstimateBRL: 0,
      raw: { mock: true, notice: 'conexão simulada — sem OAuth real' },
    };
  }

  async publish(params: PublishParams): Promise<ProviderResult<PublishResult>> {
    const ids: Record<string, string> = {};
    for (const p of params.platforms) ids[p.toLowerCase()] = `mock_${p.toLowerCase()}_${Date.now()}`;
    return { data: { externalPostIds: ids }, costEstimateBRL: 0, raw: { mock: true } };
  }

  // Métricas simuladas DETERMINÍSTICAS por post (mesmo externalPostId → mesmos números),
  // para o Analytics mostrar dados coerentes sem rede real. Plugue o real (Ayrshare/Graph).
  async fetchInsights(
    externalPostId: string,
    platform: SocialPlatform,
  ): Promise<ProviderResult<InsightsResult>> {
    const h = hash(externalPostId);
    const reach = 3000 + (h % 9000); // 3k–12k
    const likes = Math.floor(reach * (0.04 + (h % 30) / 1000)); // ~4–7%
    const comments = Math.floor(likes * 0.08);
    const followers = 55000 + (hash(platform) % 15000);
    return {
      data: { followers, reach, likes, comments },
      costEstimateBRL: 0,
      raw: { mock: true, externalPostId, platform },
    };
  }
}

// Hash determinístico (djb2) para métricas simuladas estáveis por post/plataforma.
function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h >>> 0;
}

// ---- REAL: Ayrshare ----
// PLUGAR AQUI: AYRSHARE_API_KEY + fluxo de profiles/SSO; tokens criptografados em SocialAccount.
export class AyrshareDistributionProvider implements DistributionProvider {
  private requireKey() {
    if (!process.env.AYRSHARE_API_KEY) {
      throw new Error(
        'AyrshareDistributionProvider: defina AYRSHARE_API_KEY (ou use PROVIDER_DISTRIBUTION=mock).',
      );
    }
  }
  async connect(): Promise<ProviderResult<ConnectResult>> {
    this.requireKey();
    throw new Error('AyrshareDistributionProvider.connect ainda não implementado.');
  }
  async publish(): Promise<ProviderResult<PublishResult>> {
    this.requireKey();
    throw new Error('AyrshareDistributionProvider.publish ainda não implementado.');
  }
  async fetchInsights(): Promise<ProviderResult<InsightsResult>> {
    this.requireKey();
    throw new Error('AyrshareDistributionProvider.fetchInsights ainda não implementado.');
  }
}
