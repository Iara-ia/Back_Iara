# IARA — back (API + Worker) numa imagem só; o `command` do compose escolhe o processo.
# Build: tsc → dist/. Prisma client gerado no build (engine debian = runtime debian).
# NÃO altera a aplicação: é só empacotamento. Migrations rodam no start da API.

FROM node:20-slim AS build
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
RUN npm run build

FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./
EXPOSE 3333
# Padrão = API. O worker sobe no compose com:
#   command: ["node", "dist/src/worker/main.js"]
CMD ["node", "dist/src/api/main.js"]
