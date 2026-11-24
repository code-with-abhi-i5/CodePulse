import { TombstoneCleanerService } from './tombstone-cleaner.service';
import { LogCompactorService, KafkaLogRecord } from './log-compactor.service';

describe('LogCompactorService (#1416)', () => {
  let cleaner: TombstoneCleanerService;
  let compactor: LogCompactorService;

  beforeEach(() => {
    cleaner = new TombstoneCleanerService();
    compactor = new LogCompactorService(cleaner);
  });

  afterEach(() => {
    compactor.clear();
  });

  it('should generate valid null-payload tombstone records with metadata headers', () => {
    const tombstone = cleaner.createTombstone('users.v1', 'usr-100', {
      entityType: 'USER',
      deleteRetentionMs: 3600000,
    });

    expect(tombstone.key).toBe('usr-100');
    expect(tombstone.value).toBeNull();
    expect(tombstone.headers['kafka-tombstone']).toBe('true');
    expect(tombstone.headers['entity-type']).toBe('USER');
    expect(tombstone.headers['retention-ms']).toBe('3600000');
    expect(cleaner.isTombstoned('users.v1', 'usr-100')).toBe(true);
  });

  it('should compact multi-version key history keeping only the latest version per key', () => {
    const records: KafkaLogRecord[] = [
      { offset: 0, key: 'challenge-1', value: { title: 'v1' }, timestamp: 1000 },
      { offset: 1, key: 'challenge-2', value: { title: 'v1' }, timestamp: 1010 },
      { offset: 2, key: 'challenge-1', value: { title: 'v2' }, timestamp: 1020 },
      { offset: 3, key: 'challenge-1', value: { title: 'v3-final' }, timestamp: 1030 },
    ];

    const { compacted, report } = compactor.compactPartitionLog('challenges.v1', records);

    expect(compacted.length).toBe(2);
    expect(report.inputRecordCount).toBe(4);
    expect(report.outputRecordCount).toBe(2);
    expect(report.recordsCompactedOut).toBe(2);

    const c1 = compacted.find((r) => r.key === 'challenge-1');
    expect(c1?.value.title).toBe('v3-final');
    expect(c1?.offset).toBe(3);
  });

  it('should completely purge state and prior history when tombstone record is encountered', () => {
    const records: KafkaLogRecord[] = [
      { offset: 0, key: 'user-A', value: { name: 'Alice' }, timestamp: 1000 },
      { offset: 1, key: 'user-B', value: { name: 'Bob' }, timestamp: 1010 },
      { offset: 2, key: 'user-A', value: { name: 'Alice Updated' }, timestamp: 1020 },
      // Tombstone: user-A deleted
      { offset: 3, key: 'user-A', value: null, timestamp: 1030 },
    ];

    const { compacted, report } = compactor.compactPartitionLog('users.v1', records);

    expect(compacted.length).toBe(1);
    expect(compacted[0].key).toBe('user-B');
    expect(report.purgedEntityKeys).toContain('user-A');
    expect(report.tombstoneCount).toBe(1);
  });

  it('should prevent zombie state revival when consumer replays historical event log', () => {
    // Issue tombstone for user-999
    cleaner.createTombstone('users.v1', 'user-999');

    // Simulate consumer reading an old replay event with user-999
    const staleEvent: KafkaLogRecord = {
      offset: 5,
      key: 'user-999',
      value: { name: 'Resurrected Ghost' },
      timestamp: 900,
    };

    const allowed = compactor.filterReplayedEvent('users.v1', staleEvent);
    expect(allowed).toBe(false); // Must be suppressed to guarantee zero zombie revival
  });

  it('should calculate compaction efficiency and storage reclamation percentage', () => {
    const records: KafkaLogRecord[] = [];
    // 100 updates to same key
    for (let i = 0; i < 100; i++) {
      records.push({
        offset: i,
        key: 'hot-leaderboard',
        value: { rank: i, data: 'payload-bytes-'.repeat(10) },
        timestamp: 1000 + i,
      });
    }

    const { compacted, report } = compactor.compactPartitionLog('leaderboards.v1', records);

    expect(compacted.length).toBe(1);
    expect(report.recordsCompactedOut).toBe(99);
    expect(report.storageReclaimedPercent).toBeGreaterThan(90);
  });

  it('should purge expired tombstone markers after delete.retention.ms expires', () => {
    const baseTime = 1000000;
    cleaner.createTombstone('topics.test', 'key-expire', {
      deleteRetentionMs: 5000,
    });

    expect(cleaner.getActiveTombstoneCount()).toBe(1);

    // Within retention window
    expect(cleaner.cleanExpiredTombstones(baseTime + 1000)).toBe(0);

    // After retention window expired
    expect(cleaner.cleanExpiredTombstones(baseTime + 100000)).toBe(1);
    expect(cleaner.getActiveTombstoneCount()).toBe(0);
  });
});
