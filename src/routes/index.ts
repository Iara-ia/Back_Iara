// Registro central de todas as rotas (ordem importa: storage é público, vem antes).
import type { FastifyInstance } from 'fastify';
import { registerHealthRoutes, registerAuthRoutes } from './authRoutes.js';
import { registerStorageRoutes } from './storageRoutes.js';
import { registerPersonaRoutes } from './personaRoutes.js';
import { registerContentRoutes } from './contentRoutes.js';
import { registerSocialRoutes } from './socialRoutes.js';
import { registerAnalyticsRoutes } from './analyticsRoutes.js';

export async function registerRoutes(app: FastifyInstance) {
  await registerHealthRoutes(app);
  await registerStorageRoutes(app); // público
  await registerAuthRoutes(app); // /me
  await registerPersonaRoutes(app);
  await registerContentRoutes(app);
  await registerSocialRoutes(app);
  await registerAnalyticsRoutes(app);
}
