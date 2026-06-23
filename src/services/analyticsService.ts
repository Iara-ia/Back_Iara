// SERVICE: Analytics (F1 / Sprint 3). Contagens reais da operação + métricas de redes
// agregadas dos posts PUBLICADOS via InsightsProvider (mock determinístico | Ayrshare/Graph real).
import { AnalyticsModel } from '../models/analyticsModel.js';
import { ContentModel } from '../models/contentModel.js';
import { createProviders } from '../providers/index.js';
import type { AnalyticsOverviewDTO } from '../models/dto.js';
import type { SocialPlatform } from '../lib/enums.js';

const providers = createProviders();

export const AnalyticsService = {
  async overview(
    orgId: string,
    personaId?: string,
  ): Promise<
    AnalyticsOverviewDTO & { naFila: number; agendados: number; contasConectadas: number }
  > {
    const counts = await AnalyticsModel.overviewCounts(orgId, personaId);

    // Agrega insights de cada post publicado (por plataforma) via provider de distribuição.
    // Filtra pela persona ativa quando informada (gestão por influencer).
    const publicados = await ContentModel.listByOrg(orgId, { status: 'PUBLICADO', personaId });
    let reach = 0;
    let likes = 0;
    let comments = 0;
    let followers = 0;
    const perPost: AnalyticsOverviewDTO['perPost'] = [];

    for (const it of publicados) {
      const ids = (it.externalPostIds ?? {}) as Record<string, string>;
      let pr = 0;
      let pl = 0;
      let pc = 0;
      for (const [platform, extId] of Object.entries(ids)) {
        const ins = await providers.distribution.fetchInsights(
          extId,
          platform.toUpperCase() as SocialPlatform,
        );
        pr += ins.data.reach;
        pl += ins.data.likes;
        pc += ins.data.comments;
        followers = Math.max(followers, ins.data.followers);
      }
      reach += pr;
      likes += pl;
      comments += pc;
      perPost.push({ contentItemId: it.id, reach: pr, likes: pl, comments: pc });
    }

    const engagementRate =
      reach > 0 ? Number(((((likes + comments) / reach) * 100)).toFixed(1)) : 0;

    return { followers, reach, engagementRate, perPost, ...counts };
  },
};
