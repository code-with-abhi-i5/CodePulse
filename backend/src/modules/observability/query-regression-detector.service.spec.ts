import { QueryRegressionDetectorService } from './query-regression-detector.service';

describe('QueryRegressionDetectorService', () => {
  let detector: QueryRegressionDetectorService;

  beforeEach(() => {
    detector = new QueryRegressionDetectorService();
  });

  it('should flag execution plan regression when query time doubles', () => {
    detector.setBaseline('SELECT_USER_BY_ID', 5.0);

    const alert = detector.analyzeSample({
      queryId: 'q-101',
      fingerprint: 'SELECT_USER_BY_ID',
      meanExecTimeMs: 25.0, // 5x regression
      totalCalls: 1000,
      bufferHits: 100,
      bufferMisses: 900,
    });

    expect(alert).not.toBeNull();
    expect(alert?.regressionRatio).toBe(5.0);
    expect(detector.getAlerts().length).toBe(1);
  });
});
