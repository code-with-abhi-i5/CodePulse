-- CreateEnum
CREATE TYPE "ChallengeStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'CLAIMED', 'EXPIRED');

-- AlterTable
ALTER TABLE "user_challenges" ADD COLUMN IF NOT EXISTS "status" "ChallengeStatus" NOT NULL DEFAULT 'IN_PROGRESS',
ADD COLUMN IF NOT EXISTS "claimedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "challenges_expiresAt_idx" ON "challenges"("expiresAt");
CREATE INDEX IF NOT EXISTS "challenges_category_expiresAt_idx" ON "challenges"("category", "expiresAt");
CREATE INDEX IF NOT EXISTS "user_challenges_userId_status_idx" ON "user_challenges"("userId", "status");
CREATE INDEX IF NOT EXISTS "user_challenges_status_idx" ON "user_challenges"("status");
