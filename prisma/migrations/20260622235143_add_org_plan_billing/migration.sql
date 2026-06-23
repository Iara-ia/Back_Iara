-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'STARTER', 'PRO', 'SCALE');

-- AlterTable
ALTER TABLE "Org" ADD COLUMN     "plan" "PlanTier" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "stripeCustomerId" TEXT;
