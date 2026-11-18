-- AlterEnum
ALTER TYPE "BattleStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';
ALTER TYPE "BattleStatus" ADD VALUE IF NOT EXISTS 'FORFEITED';

-- AlterTable
ALTER TABLE "battles" ADD COLUMN IF NOT EXISTS "forfeitedById" TEXT,
ADD COLUMN IF NOT EXISTS "cancellationReason" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "battles_status_endsAt_idx" ON "battles"("status", "endsAt");
CREATE INDEX IF NOT EXISTS "battles_challengerId_status_idx" ON "battles"("challengerId", "status");
CREATE INDEX IF NOT EXISTS "battles_opponentId_status_idx" ON "battles"("opponentId", "status");
