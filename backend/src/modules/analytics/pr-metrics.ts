export interface PullSnapshot {
  number: number;
  user: { login: string };
  created_at: string;
  merged_at: string | null;
  review_comments: number;
}
export interface ReviewSnapshot {
  user: { login: string } | null;
  state: string;
  submitted_at: string | null;
}
function date(value: string) {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime()))
    throw new Error('Invalid PR timestamp');
  return parsed;
}
export function parsePrMetric(
  pr: PullSnapshot,
  reviews: ReviewSnapshot[],
  partial: boolean,
) {
  if (
    !Number.isInteger(pr.number) ||
    pr.number < 1 ||
    !pr.user?.login ||
    !Number.isInteger(pr.review_comments) ||
    pr.review_comments < 0
  )
    throw new Error('Invalid PR metadata');
  const createdAt = date(pr.created_at);
  const mergedAt = pr.merged_at ? date(pr.merged_at) : null;
  if (mergedAt && mergedAt < createdAt)
    throw new Error('Merge predates creation');
  const completed = reviews
    .filter(
      (r) =>
        r.user?.login &&
        r.user.login.toLowerCase() !== pr.user.login.toLowerCase() &&
        r.submitted_at &&
        ['APPROVED', 'CHANGES_REQUESTED', 'COMMENTED', 'DISMISSED'].includes(
          r.state,
        ),
    )
    .map((r) => ({
      login: r.user!.login.toLowerCase(),
      at: date(r.submitted_at!),
    }))
    .filter((r) => r.at >= createdAt)
    .sort((a, b) => a.at.getTime() - b.at.getTime());
  const firstReviewedAt = completed[0]?.at ?? null;
  return {
    prNumber: pr.number,
    authorLogin: pr.user.login.toLowerCase(),
    createdAt,
    mergedAt,
    firstReviewedAt,
    reviewCommentsCount: pr.review_comments,
    timeToFirstReviewMs: firstReviewedAt
      ? firstReviewedAt.getTime() - createdAt.getTime()
      : null,
    timeToMergeMs: mergedAt ? mergedAt.getTime() - createdAt.getTime() : null,
    reviewers: [...new Set(completed.map((r) => r.login))],
    partial,
  };
}
export function median(values: number[]) {
  const sorted = values
    .filter((n) => Number.isFinite(n) && n >= 0)
    .sort((a, b) => a - b);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}
export function summarizePrMetrics(
  rows: {
    timeToFirstReviewMs: number | null;
    timeToMergeMs: number | null;
    reviewers: unknown;
    partial: boolean;
  }[],
) {
  const load = new Map<string, number>();
  for (const row of rows) {
    const names = Array.isArray(row.reviewers)
      ? row.reviewers.filter((r): r is string => typeof r === 'string')
      : [];
    for (const name of new Set(names))
      load.set(name, (load.get(name) ?? 0) + 1);
  }
  const totalReviews = [...load.values()].reduce((a, b) => a + b, 0);
  const medianTTFR = median(
    rows.flatMap((r) =>
      r.timeToFirstReviewMs === null ? [] : [r.timeToFirstReviewMs],
    ),
  );
  const medianMerge = median(
    rows.flatMap((r) => (r.timeToMergeMs === null ? [] : [r.timeToMergeMs])),
  );
  const reviewers = [...load]
    .map(([login, reviewedPRs]) => ({
      login,
      reviewedPRs,
      share: reviewedPRs / totalReviews,
    }))
    .sort(
      (a, b) => b.reviewedPRs - a.reviewedPRs || a.login.localeCompare(b.login),
    );
  return {
    sampledPRs: rows.length,
    partial: rows.some((r) => r.partial),
    medianTimeToFirstReviewMs: medianTTFR,
    medianTimeToMergeMs: medianMerge,
    reviewedPRPercentage: rows.length
      ? (100 * rows.filter((r) => r.timeToFirstReviewMs !== null).length) /
        rows.length
      : 0,
    reviewers,
    bottleneck: reviewers[0]?.share > 0.8 ? reviewers[0].login : null,
    efficiencyScore:
      medianTTFR === null
        ? null
        : Math.max(
            0,
            Math.round(
              100 -
                Math.min(60, medianTTFR / 3600000) -
                (reviewers[0]?.share ?? 0) * 40,
            ),
          ),
  };
}
