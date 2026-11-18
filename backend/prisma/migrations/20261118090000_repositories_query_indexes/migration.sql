-- CreateIndex
CREATE INDEX IF NOT EXISTS "repositories_userId_idx" ON "repositories"("userId");
CREATE INDEX IF NOT EXISTS "repositories_userId_language_idx" ON "repositories"("userId", "language");
CREATE INDEX IF NOT EXISTS "repositories_userId_stars_idx" ON "repositories"("userId", "stars" DESC);
CREATE INDEX IF NOT EXISTS "repositories_userId_forks_idx" ON "repositories"("userId", "forks" DESC);
CREATE INDEX IF NOT EXISTS "repositories_userId_updatedAt_idx" ON "repositories"("userId", "updatedAt" DESC);
