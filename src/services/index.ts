// Barrel da camada SERVICE (regras de negócio + orquestração).
export { PersonaService } from './personaService.js';
export { ContentService } from './contentService.js';
export { SocialService } from './socialService.js';
export { AnalyticsService } from './analyticsService.js';
export { ServiceError, isServiceError } from './errors.js';
export { canWrite, canApprove } from './rbac.js';

// Pipeline + fila + mix (compartilhados API/worker).
export { generateOneContentItem, markItemFailed } from './contentPipeline.js';
export { distributePilares, DEFAULT_PILARES } from './pilarMix.js';
export {
  connection,
  jobQueue,
  QUEUE_NAME,
  enqueueGenerateItem,
  GENERATE_ITEM_JOB_OPTS,
} from './queue.js';
export type { IaraJobData, GenerateItemPayload } from './queue.js';
