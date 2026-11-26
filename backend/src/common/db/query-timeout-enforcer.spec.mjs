import test from 'node:test';
import assert from 'node:assert/strict';

class QueryTimeoutEnforcerService {
  constructor() {
    this.defaultTimeouts = { oltp: 2000, analytics: 15000, maintenance: 60000 };
  }

  resolveTimeoutConfig(queryType, overrideMs) {
    const timeout = overrideMs || this.defaultTimeouts[queryType] || 5000;
    return { queryType, statementTimeoutMs: timeout, enforceDynamicTimeout: true };
  }

  generateTimeoutPrefix(config) {
    return 'SET LOCAL statement_timeout = ' + config.statementTimeoutMs + ';';
  }
}

test('QueryTimeoutEnforcerService - assigns dynamic statement timeouts based on query category', () => {
  const service = new QueryTimeoutEnforcerService();
  const oltp = service.resolveTimeoutConfig('oltp');
  assert.equal(oltp.statementTimeoutMs, 2000);
  assert.equal(service.generateTimeoutPrefix(oltp), 'SET LOCAL statement_timeout = 2000;');

  const analytics = service.resolveTimeoutConfig('analytics');
  assert.equal(analytics.statementTimeoutMs, 15000);
});
