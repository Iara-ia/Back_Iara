// SERVICE: Analytics (F1). No Sprint 1/2 devolve contagens reais da operação para a
// Visão Geral; métricas de redes (followers/reach) entram com insights no Sprint 3.
import { AnalyticsModel } from '../models/analyticsModel.js';
import type { AnalyticsOverviewDTO } from '../models/dto.js';

export const AnalyticsService = {
  async overview(orgId: string): Promise<
    AnalyticsOverviewDTO & { naFila: number; agendados: number; contasConectadas: number }
  > {
    const { naFila, agendados, contasConectadas } = await AnalyticsModel.overviewCounts(orgId);
    return {
      followers: 0, // redes ainda não plugadas (Sprint 3)
      reach: 0,
      engagementRate: 0,
      perPost: [],
      naFila,
      agendados,
      contasConectadas,
    };
  },
};
