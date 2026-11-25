/**
 * Architecture Service: ClickHouse Parquet Export Pipeline
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-47]
 */

export class ClickHouseParquetExportService {
  public generateExportQuery(
    tableName: string,
    s3Bucket: string,
    s3Prefix: string,
    accessKey: string,
    secretKey: string,
    partitionFilter?: string
  ): string {
    const s3Url = `https://${s3Bucket}.s3.amazonaws.com/${s3Prefix}/${tableName}_${Date.now()}.parquet`;
    const whereClause = partitionFilter ? ` WHERE ${partitionFilter}` : '';

    return `INSERT INTO FUNCTION s3('${s3Url}', '${accessKey}', '${secretKey}', 'Parquet')
SELECT * FROM ${tableName}${whereClause};`;
  }
}
