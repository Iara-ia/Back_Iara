// ROUTES: Storage (público). Definição de rota → controller.
import type { FastifyInstance } from 'fastify';
import { StorageController } from '../controllers/storageController.js';

export async function registerStorageRoutes(app: FastifyInstance) {
  app.get('/storage/*', StorageController.serve);
}
