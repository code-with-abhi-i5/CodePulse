import { median, parsePrMetric, summarizePrMetrics } from './pr-metrics';
const pr = {
  number: 1,
  user: { login: 'Author' },
  created_at: '2026-11-01T00:00:00Z',
  merged_at: '2026-11-03T00:00:00Z',
  review_comments: 4,
};
describe('PR lifecycle metrics', () => {
  it('selects the earliest completed external review regardless of order', () => {
    const row = parsePrMetric(
      pr,
      [
        {
          user: { login: 'B' },
          state: 'APPROVED',
          submitted_at: '2026-11-02T00:00:00Z',
        },
        {
          user: { login: 'author' },
          state: 'COMMENTED',
          submitted_at: '2026-11-01T01:00:00Z',
        },
        { user: { login: 'A' }, state: 'PENDING', submitted_at: null },
        {
          user: { login: 'B' },
          state: 'COMMENTED',
          submitted_at: '2026-11-01T12:00:00Z',
        },
      ],
      false,
    );
    expect(row.timeToFirstReviewMs).toBe(43200000);
    expect(row.timeToMergeMs).toBe(172800000);
    expect(row.reviewers).toEqual(['b']);
    expect(row.reviewCommentsCount).toBe(4);
  });
  it('represents missing events with null and rejects invalid/negative timestamps', () => {
    expect(parsePrMetric({ ...pr, merged_at: null }, [], true)).toMatchObject({
      firstReviewedAt: null,
      timeToMergeMs: null,
      partial: true,
    });
    expect(() =>
      parsePrMetric({ ...pr, created_at: 'invalid' }, [], false),
    ).toThrow();
    expect(() =>
      parsePrMetric({ ...pr, merged_at: '2020-01-01' }, [], false),
    ).toThrow();
  });
  it('uses medians so one stale PR does not dominate, while retaining zero-duration evidence', () => {
    expect(median([1000, 2000, 100000000000])).toBe(2000);
    expect(median([0, 1000])).toBe(500);
    expect(median([])).toBeNull();
  });
  it('counts unique PR/reviewer pairs and reports coverage and bottlenecks', () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({
      timeToFirstReviewMs: i < 9 ? 1000 : null,
      timeToMergeMs: i < 5 ? 2000 : null,
      reviewers: i < 9 ? ['alice', 'alice'] : [],
      partial: i === 9,
    }));
    const result = summarizePrMetrics(rows);
    expect(result.reviewedPRPercentage).toBe(90);
    expect(result.reviewers).toEqual([
      { login: 'alice', reviewedPRs: 9, share: 1 },
    ]);
    expect(result.bottleneck).toBe('alice');
    expect(result.partial).toBe(true);
    expect(summarizePrMetrics([]).efficiencyScore).toBeNull();
  });
});
