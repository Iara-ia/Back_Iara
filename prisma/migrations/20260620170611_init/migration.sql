-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "PersonaStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('RASCUNHO', 'GERADO', 'EM_REVISAO', 'APROVADO', 'AGENDADO', 'PUBLICADO', 'FALHOU', 'REPROVADO');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('POST', 'REEL', 'STORY', 'BLOG');

-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('INSTAGRAM', 'TIKTOK', 'YOUTUBE');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('CONNECTED', 'ERROR', 'EXPIRED');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('GEN_IMAGE', 'CONSISTENCY_GATE', 'GEN_CAPTION', 'SAFETY_GATE', 'PUBLISH', 'FETCH_INSIGHTS');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'RUNNING', 'DONE', 'FAILED');

-- CreateEnum
CREATE TYPE "InteractionStatus" AS ENUM ('RECEIVED', 'CLASSIFIED', 'REPLY_DRAFTED', 'ANSWERED', 'ROUTED');

-- CreateEnum
CREATE TYPE "MonetizationSource" AS ENUM ('AFFILIATE', 'BRAND_DEAL', 'SUBSCRIPTION', 'ADSENSE', 'OTHER');

-- CreateTable
CREATE TABLE "Org" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Org_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'OWNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Persona" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bio" TEXT,
    "niches" TEXT[],
    "language" TEXT NOT NULL DEFAULT 'pt-BR',
    "status" "PersonaStatus" NOT NULL DEFAULT 'DRAFT',
    "visualProfile" JSONB NOT NULL,
    "voiceProfile" JSONB,
    "personality" JSONB NOT NULL,
    "aiDisclosure" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Persona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialAccount" (
    "id" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "handle" TEXT NOT NULL,
    "tokenEnc" TEXT NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'CONNECTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentItem" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "type" "ContentType" NOT NULL DEFAULT 'POST',
    "pilar" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'RASCUNHO',
    "assets" JSONB NOT NULL,
    "caption" TEXT,
    "hashtags" TEXT[],
    "cta" TEXT,
    "affiliateLinks" JSONB,
    "qaFlags" JSONB,
    "scheduleAt" TIMESTAMP(3),
    "platforms" "SocialPlatform"[],
    "externalPostIds" JSONB,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "contentItemId" TEXT,
    "type" "JobType" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "payload" JSONB NOT NULL,
    "costEstimate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "logs" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interaction" (
    "id" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "externalId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "inboundText" TEXT NOT NULL,
    "replyDraft" TEXT,
    "status" "InteractionStatus" NOT NULL DEFAULT 'RECEIVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Interaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonetizationEvent" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "contentItemId" TEXT,
    "source" "MonetizationSource" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "externalRef" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonetizationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_orgId_idx" ON "User"("orgId");

-- CreateIndex
CREATE INDEX "Persona_orgId_idx" ON "Persona"("orgId");

-- CreateIndex
CREATE INDEX "SocialAccount_personaId_idx" ON "SocialAccount"("personaId");

-- CreateIndex
CREATE INDEX "ContentItem_orgId_status_idx" ON "ContentItem"("orgId", "status");

-- CreateIndex
CREATE INDEX "ContentItem_personaId_idx" ON "ContentItem"("personaId");

-- CreateIndex
CREATE INDEX "Job_orgId_status_idx" ON "Job"("orgId", "status");

-- CreateIndex
CREATE INDEX "Interaction_personaId_idx" ON "Interaction"("personaId");

-- CreateIndex
CREATE INDEX "MonetizationEvent_orgId_idx" ON "MonetizationEvent"("orgId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Persona" ADD CONSTRAINT "Persona_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialAccount" ADD CONSTRAINT "SocialAccount_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonetizationEvent" ADD CONSTRAINT "MonetizationEvent_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonetizationEvent" ADD CONSTRAINT "MonetizationEvent_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
