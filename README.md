# Back_Iara

API (Fastify) + worker (BullMQ) da plataforma **IARA**. Arquitetura **MVC**. Multi-tenant
(isolamento por `orgId`) + RBAC (owner/editor/viewer). Pipeline de conteúdo com gates de
consistência facial, segurança e compliance (Conar/LGPD). Providers de IA atrás de
interfaces provider-agnostic (mock por padrão; Claude real por env).

## Arquitetura (MVC)

```
src/
  config/        env central + storage local (stub S3/R2)
  lib/           contratos Zod (FONTE DE VERDADE), enums, envelope de resposta, crypto
  models/        acesso a dados — Prisma client + repositórios + DTOs de domínio
  views/         serializers (Prisma → DTO de resposta)
  services/      REGRAS DE NEGÓCIO — pipeline, gates, mix de pilares, RBAC, orquestração de providers
  controllers/   recebem req/res, validam payload, chamam services, serializam via views
  routes/        definição de rotas → controllers
  middlewares/   sessão (A2), RBAC guard, tratamento de erro
  providers/     LLM (Claude), imagem (Flux), distribuição (Ayrshare), safety, consistência — mock|real por env
  api/main.ts    entrypoint da API (Fastify)
  worker/        worker BullMQ + jobs + scripts de QA + enqueue de teste
prisma/          schema + migrations + seed (Isabella)
```

Fluxo de uma requisição: **route → controller → service → model**, resposta serializada
pela **view**. Regras de domínio (gates, transições do kanban, aprovação) ficam em
`services/`; controllers são finos (só I/O HTTP).

### O caminho do conteúdo (Épico B)

1. `POST /content/generate` → `ContentService.generate` cria N itens em `GERADO`
   (mix de pilares determinístico, B5) e **enfileira** um job `GENERATE_ITEM` por item.
2. O **worker** consome a fila e roda `generateOneContentItem` (`services/contentPipeline.ts`):
   imagem → gate de consistência (B2) → legenda → selo de IA + #publi (B3) → gate de
   safety/compliance (B4) → `EM_REVISAO` (ou `REPROVADO`/`FALHOU`).
3. O painel (Front-Iara) faz polling de `GET /content` e cura no kanban; aprovar valida os
   gates + RBAC em `ContentService.patch`.

## Pré-requisitos

- Node 20+
- Postgres (pgvector) + Redis — suba via **Infra_Iara** (`docker compose up -d`).

## Rodar (dev)

```bash
npm install
cp .env.example .env            # ajuste DATABASE_URL / REDIS_URL se preciso
npm run db:generate             # gera o @prisma/client
npm run db:migrate              # aplica o schema (cria as tabelas)
npm run db:seed                 # cria a org + owner + persona Isabella

npm run dev                     # sobe API (:3333) + worker em paralelo
# ou separadamente:
npm run dev:api
npm run dev:worker
```

## Providers (mock vs real)

Tudo mock por padrão (funciona sem nenhuma chave de API). Troque por env:

| Env | Valores | Observação |
| --- | --- | --- |
| `PROVIDER_LLM` | `mock` \| `claude` | `claude` exige `ANTHROPIC_API_KEY` (caminho real preservado) |
| `PROVIDER_IMAGE` | `mock` \| `flux` | `flux` ainda stub (plugar Replicate/Fal) |
| `PROVIDER_DISTRIBUTION` | `mock` \| `ayrshare` | `ayrshare` ainda stub |
| `PROVIDER_SAFETY` | `mock` \| `real` | motor de texto sempre real; `real` liga moderador de imagem |
| `PROVIDER_CONSISTENCY` | `mock` \| `real` | `real` = embedding facial (cosseno) vs refs aprovadas |

## Scripts de QA (provas dos Sprints)

```bash
npm run enqueue:test     # A1: job de teste ponta a ponta
npm run qa:idempotency <contentItemId>   # jobId = contentItemId → no-op em re-enqueue
PROVIDER_IMAGE=flux npm run qa:retry     # retry/backoff + FALHOU definitivo (fila isolada)
PROVIDER_CONSISTENCY=real npm run qa:gate-e2e    # gate de consistência REAL reprova item
PROVIDER_SAFETY=real PROVIDER_CONSISTENCY=real npm run qa:gates-real  # gates reais isolados
```

## Contratos de API

A fonte de verdade dos contratos (Zod) é [`src/lib/contracts.ts`](src/lib/contracts.ts). O
Front-Iara mantém uma cópia vendorada dos tipos em `Front-Iara/lib/contracts.ts` (ver o
cabeçalho de lá para re-sincronizar).

## Scripts

| Script | O quê |
| --- | --- |
| `npm run dev` | API + worker em paralelo |
| `npm run build` | `tsc` → `dist/` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:generate` / `db:migrate` / `db:seed` / `db:studio` | Prisma |
| `npm run start:api` / `start:worker` | rodar o build |
