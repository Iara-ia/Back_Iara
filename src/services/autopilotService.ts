// ============================================================
// SERVICE (V1) — Piloto automático. Pega itens EM_REVISAO, AUTO-APROVA os que PASSAM
// nos gates (a lógica de gate vive em ContentService.patch) e AUTO-AGENDA 1 por dia
// (IG+TikTok). Itens reprovados pelos gates ficam de fora — HITL real: humano resolve.
//
// Fluxo autônomo completo: generate (fila) → pipeline (gera+gates) → EM_REVISAO →
// autopilot (auto-aprova+agenda) → worker publica sozinho no horário.
// ============================================================
import { ContentModel } from '../models/contentModel.js';
import { ContentService } from './contentService.js';
import { isServiceError } from './errors.js';
import type { SocialPlatform } from '../lib/enums.js';

const SISTEMA_USER = 'autopilot';
const DEFAULT_PLATFORMS = ['INSTAGRAM', 'TIKTOK'] as SocialPlatform[];

// Próximos `count` dias às 09:00 (horário do servidor), começando amanhã.
function nextSlots(count: number): Date[] {
  const slots: Date[] = [];
  const base = new Date();
  base.setHours(9, 0, 0, 0);
  base.setDate(base.getDate() + 1);
  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    slots.push(d);
  }
  return slots;
}

export const AutopilotService = {
  async runForOrg(orgId: string, personaId?: string) {
    const emRevisao = await ContentModel.listByOrg(orgId, {
      status: 'EM_REVISAO',
      ...(personaId ? { personaId } : {}),
    });
    const slots = nextSlots(emRevisao.length);
    let approved = 0;
    let scheduled = 0;
    let slotIdx = 0;
    const skipped: { id: string; reason: string }[] = [];

    for (const it of emRevisao) {
      try {
        // Auto-aprova: ContentService.patch roda os gates (consistência/safety/compliance).
        await ContentService.patch(it.id, orgId, 'OWNER', SISTEMA_USER, { status: 'APROVADO' });
        approved++;
        // Auto-agenda: 1 por dia, IG+TikTok. O worker publica sozinho no horário.
        await ContentService.schedule(it.id, orgId, 'OWNER', {
          scheduleAt: slots[slotIdx]!.toISOString(),
          platforms: DEFAULT_PLATFORMS,
        });
        scheduled++;
        slotIdx++;
      } catch (e) {
        skipped.push({ id: it.id, reason: isServiceError(e) ? e.message : String(e) });
      }
    }
    return { candidatos: emRevisao.length, aprovados: approved, agendados: scheduled, ignorados: skipped };
  },
};
