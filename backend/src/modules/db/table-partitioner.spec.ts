import { TablePartitionerService } from './table-partitioner.service';

describe('TablePartitionerService', () => {
  let service: TablePartitionerService;

  beforeEach(() => {
    service = new TablePartitionerService();
  });

  it('generates valid postgresql partition DDL for time-range tables', () => {
    const sql = service.generateMonthlyPartitionSql('match_history', 2026, 12);
    expect(sql).toContain('match_history_y2026m12');
    expect(sql).toContain('2027-01-01');
  });
});
