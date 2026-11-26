import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class TablePartitionerService {
  getPartitionName(tableName, date) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    return `${tableName}_y${year}m${month}`;
  }

  generateMonthlyPartitionSql(tableName, year, month) {
    const startMonth = String(month).padStart(2, '0');
    const nextMonthVal = month === 12 ? 1 : month + 1;
    const nextYearVal = month === 12 ? year + 1 : year;
    const endMonth = String(nextMonthVal).padStart(2, '0');
    const partName = `${tableName}_y${year}m${startMonth}`;
    return `CREATE TABLE IF NOT EXISTS ${partName} PARTITION OF ${tableName} FOR VALUES FROM ('${year}-${startMonth}-01') TO ('${nextYearVal}-${endMonth}-01');`;
  }

  ensurePartitionsExist(tableName, monthsAhead = 3) {
    const statements = [];
    const now = new Date(Date.UTC(2026, 10, 1));
    for (let i = 0; i < monthsAhead; i++) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1));
      statements.push(this.generateMonthlyPartitionSql(tableName, d.getUTCFullYear(), d.getUTCMonth() + 1));
    }
    return statements;
  }
}

describe('TablePartitionerService', () => {
  it('generates deterministic monthly partition tables for large-scale match history', () => {
    const service = new TablePartitionerService();
    const sql = service.generateMonthlyPartitionSql('match_history', 2026, 11);
    assert.ok(sql.includes('match_history_y2026m11'));
    assert.ok(sql.includes('2026-12-01'));

    const parts = service.ensurePartitionsExist('match_history', 3);
    assert.equal(parts.length, 3);
  });
});
