import test from 'node:test';
import assert from 'node:assert/strict';

class LogVolumeSpikeBreaker {
  constructor(maxLogsPerSecond = 500) {
    this.maxLogsPerSecond = maxLogsPerSecond;
    this.currentSecond = 0;
    this.logCountThisSecond = 0;
  }

  evaluate(event) {
    const sec = Math.floor(event.timestamp / 1000);
    if (sec !== this.currentSecond) {
      this.currentSecond = sec;
      this.logCountThisSecond = 0;
    }

    this.logCountThisSecond++;

    if (event.level === 'error' || event.level === 'fatal') {
      return { shouldLog: true, isThrottled: false, activeRate: this.logCountThisSecond };
    }

    const isThrottled = this.logCountThisSecond > this.maxLogsPerSecond;
    return {
      shouldLog: !isThrottled,
      isThrottled,
      activeRate: this.logCountThisSecond
    };
  }
}

test('LogVolumeSpikeBreaker - throttles noisy debug logs while allowing critical errors', () => {
  const breaker = new LogVolumeSpikeBreaker(5);
  const now = Date.now();

  for (let i = 0; i < 5; i++) {
    const res = breaker.evaluate({ level: 'debug', message: 'test', timestamp: now });
    assert.strictEqual(res.shouldLog, true);
  }

  const sixth = breaker.evaluate({ level: 'debug', message: 'test', timestamp: now });
  assert.strictEqual(sixth.shouldLog, false);
  assert.strictEqual(sixth.isThrottled, true);

  const crit = breaker.evaluate({ level: 'error', message: 'fatal crash', timestamp: now });
  assert.strictEqual(crit.shouldLog, true);
});
