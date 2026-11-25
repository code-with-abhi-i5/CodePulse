import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSequenceOverflowWatchdogService } from './db-data-43.service.ts';

describe('DatabaseSequenceOverflowWatchdogService (DB-DATA-43)', () => {
  it('flags sequences nearing integer overflow limits and recommends BIGINT migration', () => {
    const watchdog = new DatabaseSequenceOverflowWatchdogService(0.8);
    const maxInt32 = 2147483647;

    const sequences = [
      { sequenceName: 'users_id_seq', currentValue: 1800000000, maxValue: maxInt32 }, // ~83.8%
      { sequenceName: 'battles_id_seq', currentValue: 50000, maxValue: maxInt32 }      // safe
    ];

    const alerts = watchdog.checkSequences(sequences);
    assert.strictEqual(alerts.length, 1);
    assert.strictEqual(alerts[0].sequenceName, 'users_id_seq');
    assert.ok(alerts[0].capacityUsed > 80);
    assert.ok(alerts[0].recommendation.includes('Migrate primary key column to BIGINT'));
  });
});
