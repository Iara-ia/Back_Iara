// MIDDLEWARE: tratamento central de erros. Traduz ServiceError (domínio) e erros de
// validação Zod no envelope padrão (err()). Mantém os controllers enxutos.
import type { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { isServiceError } from '../services/errors.js';
import { err } from '../lib/reply.js';

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, _req, reply) => {
    if (isServiceError(error)) {
      reply.code(error.status);
      return reply.send(err(error.code, error.message, error.details));
    }
    if (error instanceof ZodError) {
      reply.code(400);
      return reply.send(err('VALIDATION', 'Payload inválido', error.flatten()));
    }
    app.log.error(error);
    reply.code(500);
    return reply.send(err('INTERNAL', 'Erro interno.'));
  });
}
