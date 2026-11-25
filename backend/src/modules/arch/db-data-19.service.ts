/**
 * Architecture Service: ClickHouse Materialized View Aggregation Pipeline
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-19]
 */

export class ClickHouseMaterializedViewService {
  public generateAggregationDdl(
    sourceTable: string,
    viewName: string,
    destinationTable: string
  ): { targetTableDdl: string; materializedViewDdl: string } {
    const targetTableDdl = `CREATE TABLE IF NOT EXISTS ${destinationTable} (
  user_id String,
  challenge_id String,
  event_date Date,
  total_attempts UInt32,
  successful_solves UInt32,
  total_duration_ms UInt64
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(event_date)
ORDER BY (user_id, challenge_id, event_date);`;

    const materializedViewDdl = `CREATE MATERIALIZED VIEW IF NOT EXISTS ${viewName} TO ${destinationTable} AS
SELECT
  user_id,
  challenge_id,
  toDate(timestamp) as event_date,
  count() as total_attempts,
  countIf(status = 'ACCEPTED') as successful_solves,
  sum(duration_ms) as total_duration_ms
FROM ${sourceTable}
GROUP BY user_id, challenge_id, event_date;`;

    return { targetTableDdl, materializedViewDdl };
  }
}
