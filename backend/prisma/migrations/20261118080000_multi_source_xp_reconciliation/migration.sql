-- AlterTable
ALTER TABLE "developer_ratings" ADD COLUMN IF NOT EXISTS "githubXp" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "gamificationXp" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "developer_ratings_userId_xp_idx" ON "developer_ratings"("userId", "xp" DESC);
