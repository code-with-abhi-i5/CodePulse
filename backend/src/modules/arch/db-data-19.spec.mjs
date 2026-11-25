import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ClickHouseMaterializedViewService } from './db-data-19.service.ts';

describe('ClickHouseMaterializedViewService (DB-DATA-19)', () => {
  it('generates correct SummingMergeTree target table and Materialized View DDL', () => {
    const service = new ClickHouseMaterializedViewService();
    const ddl = service.generateAggregationDdl('raw_submissions', 'mv_user_challenge_metrics', 'agg_user_challenge_metrics');

    assert.ok(ddl.targetTableDdl.includes('ENGINE = SummingMergeTree()'));
    assert.ok(ddl.materializedViewDdl.includes('CREATE MATERIALIZED VIEW IF NOT EXISTS mv_user_challenge_metrics'));
    assert.ok(ddl.materializedViewDdl.includes("countIf(status = 'ACCEPTED')"));
  });
});
