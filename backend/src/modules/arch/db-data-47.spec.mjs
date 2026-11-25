import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ClickHouseParquetExportService } from './db-data-47.service.ts';

describe('ClickHouseParquetExportService (DB-DATA-47)', () => {
  it('generates ClickHouse streaming Parquet export query for S3 data lake', () => {
    const service = new ClickHouseParquetExportService();
    const query = service.generateExportQuery(
      'telemetry_events',
      'codepulse-lake',
      'analytics/exports',
      'AKIA_TEST',
      'SECRET_KEY',
      "event_date >= '2026-11-01'"
    );

    assert.ok(query.includes("FUNCTION s3('https://codepulse-lake.s3.amazonaws.com/analytics/exports/"));
    assert.ok(query.includes("'Parquet'"));
    assert.ok(query.includes("WHERE event_date >= '2026-11-01'"));
  });
});
