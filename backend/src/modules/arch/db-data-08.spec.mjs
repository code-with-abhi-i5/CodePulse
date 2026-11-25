import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DistributedCdcPipelineService } from './db-data-08.service.ts';

describe('DistributedCdcPipelineService (DB-DATA-08)', () => {
  it('transforms WAL change events into partitioned Kafka CDC messages', () => {
    const service = new DistributedCdcPipelineService();
    const walEvent = {
      lsn: '0/15A3B80',
      table: 'users',
      operation: 'UPDATE',
      timestamp: 1700000000,
      before: { id: 'u-123', email: 'old@example.com' },
      after: { id: 'u-123', email: 'new@example.com' }
    };

    const msg = service.transformToKafkaMessage(walEvent, 'id');
    assert.strictEqual(msg.topic, 'cdc.events.users');
    assert.strictEqual(msg.key, 'u-123');
    assert.strictEqual(msg.value.op, 'UPDATE');
    assert.strictEqual(msg.value.after.email, 'new@example.com');
  });
});
