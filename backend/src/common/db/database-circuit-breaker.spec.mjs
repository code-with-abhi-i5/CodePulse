import test from 'node:test';
import assert from 'node:assert/strict';

class DatabaseCircuitBreakerService {
  constructor() {
    this.windowQueries = [];
    this.state = 'CLOSED';
  }

  recordQuery(isSuccess) {
    this.windowQueries.push(isSuccess);
    if (this.windowQueries.length > 20) this.windowQueries.shift();
    const total = this.windowQueries.length;
    if (total >= 5) {
      const errors = this.windowQueries.filter(s => !s).length;
      if (errors / total >= 0.50) this.state = 'OPEN';
    }
  }

  canExecute() {
    return this.state !== 'OPEN';
  }

  getState() {
    return this.state;
  }
}

test('DatabaseCircuitBreakerService - trips to OPEN when error rate exceeds 50%', () => {
  const cb = new DatabaseCircuitBreakerService();
  assert.equal(cb.canExecute(), true);

  // Record 6 failed queries out of 6
  for (let i = 0; i < 6; i++) cb.recordQuery(false);

  assert.equal(cb.getState(), 'OPEN');
  assert.equal(cb.canExecute(), false);
});
