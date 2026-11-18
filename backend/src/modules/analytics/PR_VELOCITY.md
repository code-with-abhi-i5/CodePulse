# PR review snapshots (#322)

`GET /api/v1/analytics/pr-velocity` returns exportable JSON for the authenticated
owner's active public repositories, restricted to PRs created in the last 30 days.
It includes median time to first external review, median time to merge, percentage
of sampled PRs reviewed, distinct PR/reviewer workload and concentration warnings.
Missing review/merge events are null, never zero. The efficiency score is a
documented product heuristic, not a validated team-performance measure.

`POST /api/v1/analytics/pr-velocity/refresh/:repositoryId` verifies ownership and
refreshes up to ten recently updated PRs and 100 reviews per PR. It is throttled
to one request per hour by the existing application throttler. A nightly worker
also refreshes up to ten recently updated public repository records. These bounds
are sampling limits, not a claim of complete organization coverage; paginated
evidence sets `partial`. An empty report means no collected evidence, not a
perfect score. Other repositories can be refreshed by their authenticated owner.

Each refresh persists snapshots atomically, upserting by repository/PR number.
GitHub failures preserve previous snapshots. The migration uses double-precision
millisecond durations to preserve delays beyond the 32-bit integer range. Pending
and self reviews are excluded; completed/dismissed external reviews remain part
of the historical evidence. Reviewer load counts PR/reviewer pairs, not inline
comment volume. The separate review-comment count comes from PR metadata.

Apply the Prisma migration using the normal deployment procedure. Validation:

```sh
npx prisma generate
npm test -- --runInBand src/modules/analytics/pr-metrics.spec.ts src/modules/analytics/pr-analytics.service.spec.ts
node --test test/pr-velocity-migration.test.mjs
npm run build
```

AI-assisted with Codex. Network/database boundaries are mocked in unit tests;
the migration regression uses local PostgreSQL-compatible PGlite.
