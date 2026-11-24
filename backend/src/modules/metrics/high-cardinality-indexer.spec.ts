import { HighCardinalityIndexerService } from './high-cardinality-indexer.service';
import { MetricCompactorService } from './metric-compactor.service';

describe('HighCardinalityIndexerService & MetricCompactorService', () => {
  let indexer: HighCardinalityIndexerService;
  let compactor: MetricCompactorService;

  beforeEach(() => {
    indexer = new HighCardinalityIndexerService();
    compactor = new MetricCompactorService(indexer);
  });

  describe('HighCardinalityIndexerService', () => {
    it('should detect high-entropy keys such as userId and sessionId', () => {
      expect(indexer.hasHighCardinality({ userId: 'u-12345', method: 'GET' })).toBe(true);
      expect(indexer.hasHighCardinality({ challenge_id: 'ch-88', status: '200' })).toBe(true);
      expect(indexer.hasHighCardinality({ method: 'POST', status: '201', env: 'prod' })).toBe(false);
    });

    it('should retain granular samples queryable by entity id', () => {
      indexer.recordGranular('http_requests', 1, { userId: 'alice', route: '/challenges' });
      indexer.recordGranular('http_requests', 1, { userId: 'alice', route: '/submit' });
      indexer.recordGranular('http_requests', 1, { userId: 'bob', route: '/leaderboard' });

      const aliceMetrics = indexer.queryEntityMetrics('userId', 'alice');
      expect(aliceMetrics.length).toBe(2);
      expect(aliceMetrics[0].metricName).toBe('http_requests');
    });
  });

  describe('MetricCompactorService', () => {
    it('should strip high-entropy dimensions and aggregate into bounded low-cardinality buckets', () => {
      // Ingest 500 requests across 500 different user IDs but same route/status
      for (let i = 0; i < 500; i++) {
        compactor.ingest('http_request_duration_ms', 12.5, {
          userId: `usr-${i}`,
          method: 'GET',
          route: '/api/v1/challenges',
          status: '200',
        });
      }

      // Compacted buckets must only have 1 single time-series instead of 500!
      expect(compactor.getCompactedSeriesCount()).toBe(1);

      // Local indexer should retain granular samples
      expect(indexer.getBufferSize()).toBe(500);

      // Prometheus export should have sum and count
      const promOutput = compactor.exportPrometheus();
      expect(promOutput).toContain('http_request_duration_ms_count{method="GET",route="/api/v1/challenges",status="200"} 500');
      expect(promOutput).toContain('http_request_duration_ms_sum{method="GET",route="/api/v1/challenges",status="200"} 6250');
      expect(promOutput).not.toContain('usr-');
    });
  });
});
