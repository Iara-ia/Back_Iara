// Entrypoint da API (Fastify). Bootstrap: CORS → storage → sessão → error handler → rotas.
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { providersInfo } from '../providers/index.js';
import { registerAuth } from '../middlewares/session.js';
import { registerErrorHandler } from '../middlewares/error.js';
import { registerRoutes } from '../routes/index.js';
import { ensureStorage } from '../config/storage.js';
import { config } from '../config/env.js';

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: true,
  // headers de sessão dev (A2)
  allowedHeaders: ['content-type', 'x-user-id', 'x-org-id'],
});

await ensureStorage();

// A2 — hook de sessão/isolamento por org (popula req.session em rotas não-públicas).
registerAuth(app);

// Tratamento central de erros (ServiceError + Zod → envelope padrão).
registerErrorHandler(app);

// Rotas por domínio (routes → controllers → services → models).
await registerRoutes(app);

app
  .listen({ port: config.api.port, host: '0.0.0.0' })
  .then(() => {
    app.log.info(`API IARA ouvindo em :${config.api.port}`);
    app.log.info({ providers: providersInfo() }, 'providers ativos');
  })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
