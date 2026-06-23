// Barrel da camada SERVICE (regras de negócio + orquestração).
export { PersonaService } from './personaService.js';
export { NicheService } from './nicheService.js';
export { ContentService } from './contentService.js';
export { AutopilotService } from './autopilotService.js';
export { SocialService } from './socialService.js';
export { EngagementService } from './engagementService.js';
export { BillingService } from './billingService.js';
export { AnalyticsService } from './analyticsService.js';
export { ServiceError, isServiceError } from './errors.js';
export { canWrite, canApprove } from './rbac.js';

// Pipeline + fila + mix (compartilhados API/worker).
export { generateOneContentItem, markItemFailed } from './contentPipeline.js';
export { publishOneContentItem } from './publishItem.js';
export { distributePilares, DEFAULT_PILARES } from './pilarMix.js';
export {
  connection,
  jobQueue,
  QUEUE_NAME,
  enqueueGenerateItem,
  enqueuePublishItem,
  GENERATE_ITEM_JOB_OPTS,
  PUBLISH_ITEM_JOB_OPTS,
} from './queue.js';
export type { IaraJobData, GenerateItemPayload, PublishItemPayload } from './queue.js';
