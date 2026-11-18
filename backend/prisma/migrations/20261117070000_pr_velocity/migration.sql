CREATE TABLE "pull_request_metrics" (
  "id" TEXT NOT NULL,
  "repositoryId" TEXT NOT NULL,
  "prNumber" INTEGER NOT NULL,
  "authorLogin" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL,
  "firstReviewedAt" TIMESTAMP(3),
  "mergedAt" TIMESTAMP(3),
  "reviewCommentsCount" INTEGER NOT NULL DEFAULT 0,
  "timeToFirstReviewMs" DOUBLE PRECISION,
  "timeToMergeMs" DOUBLE PRECISION,
  "reviewers" JSONB NOT NULL DEFAULT '[]',
  "partial" BOOLEAN NOT NULL DEFAULT false,
  "refreshedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "pull_request_metrics_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "pull_request_metrics_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "pull_request_metrics_repositoryId_prNumber_key" ON "pull_request_metrics"("repositoryId", "prNumber");
CREATE INDEX "pull_request_metrics_createdAt_idx" ON "pull_request_metrics"("createdAt");
