import { ParquetArchiverService } from './parquet-archiver.service';

describe('ParquetArchiverService', () => {
  let service: ParquetArchiverService;

  beforeEach(() => {
    service = new ParquetArchiverService();
  });

  it('compresses historical records and generates partitioned storage keys', () => {
    const key = service.generateStorageKey('battle_logs', 1700000000000, 3);
    expect(key).toContain('battle_logs/');
    expect(key).toContain('shard_3');
  });
});
