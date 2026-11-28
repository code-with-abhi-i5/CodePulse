import test from 'node:test';
import assert from 'node:assert/strict';

class PostgresSequenceExhaustMonitorService {
  evaluateSequence(sequenceName, currentValue, maxValue = 2147483647) {
    const percent = Math.round((currentValue / maxValue) * 10000) / 100;
    return {
      sequenceName,
      currentValue,
      maxValue,
      percentUsed: percent,
      isNearingExhaustion: percent >= 80.0
    };
  }
}

test('PostgresSequenceExhaustMonitorService - warns when sequence utilization exceeds 80%', () => {
  const service = new PostgresSequenceExhaustMonitorService();
  const safe = service.evaluateSequence('users_id_seq', 50000000);
  assert.equal(safe.isNearingExhaustion, false);

  const critical = service.evaluateSequence('battles_id_seq', 1850000000);
  assert.equal(critical.isNearingExhaustion, true);
  assert.ok(critical.percentUsed > 80);
});
