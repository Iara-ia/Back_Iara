// ROUTES: Persona (A3). Definição de rotas → controller.
import type { FastifyInstance } from 'fastify';
import { PersonaController } from '../controllers/personaController.js';

export async function registerPersonaRoutes(app: FastifyInstance) {
  app.get('/personas', PersonaController.list);
  app.post('/personas', PersonaController.create);
  app.get('/personas/:id', PersonaController.getById);
  app.put('/personas/:id', PersonaController.update);
  app.post('/personas/:id/refs', PersonaController.addRefs);
}
