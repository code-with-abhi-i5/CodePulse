import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class PartitionTableRouterService {
  computePartition(baseTableName, timestampMs = Date.now()) {
    const date = new Date(timestampMs);
    const partitionYear = date.getUTCFullYear();
    const partitionMonth = date.getUTCMonth() + 1;
    const partitionDay = date.getUTCDate();

    const monthStr = String(partitionMonth).padStart(2, '0');
    const dayStr = String(partitionDay).padStart(2, '0');

    const partitionTableName = baseTableName + '_y' + partitionYear + 'm' + monthStr + 'd' + dayStr;

    const startIso = partitionYear + '-' + monthStr + '-' + dayStr + ' 00:00:00+00';
    const nextDate = new Date(Date.UTC(partitionYear, partitionMonth - 1, partitionDay + 1));
    const nextMonthStr = String(nextDate.getUTCMonth() + 1).padStart(2, '0');
    const nextDayStr = String(nextDate.getUTCDate()).padStart(2, '0');
    const endIso = nextDate.getUTCFullYear() + '-' + nextMonthStr + '-' + nextDayStr + ' 00:00:00+00';

    const createPartitionSql = 'CREATE TABLE IF NOT EXISTS "' + partitionTableName + '" PARTITION OF "' + baseTableName + '" FOR VALUES FROM (\'' + startIso + '\') TO (\'' + endIso + '\');';

    return {
      partitionTableName,
      partitionYear,
      partitionMonth,
      partitionDay,
      createPartitionSql
    };
  }
}

describe('PartitionTableRouterService', () => {
  const router = new PartitionTableRouterService();

  it('determines deterministic daily partition names and date ranges', () => {
    // 2026-11-26 15:30:00 UTC
    const ts = Date.UTC(2026, 10, 26, 15, 30, 0);
    const res = router.computePartition('submission_logs', ts);

    assert.equal(res.partitionTableName, 'submission_logs_y2026m11d26');
    assert.equal(res.partitionYear, 2026);
    assert.equal(res.partitionMonth, 11);
    assert.equal(res.partitionDay, 26);
    assert.ok(res.createPartitionSql.includes('PARTITION OF "submission_logs"'));
    assert.ok(res.createPartitionSql.includes("FOR VALUES FROM ('2026-11-26 00:00:00+00') TO ('2026-11-27 00:00:00+00')"));
  });
});
