import { Injectable } from '@nestjs/common';

@Injectable()
export class TablePartitionerService {
  getPartitionName(tableName: string, date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    return `${tableName}_y${year}m${month}`;
  }

  generateMonthlyPartitionSql(tableName: string, year: number, month: number): string {
    const startMonth = String(month).padStart(2, '0');
    const nextMonthVal = month === 12 ? 1 : month + 1;
    const nextYearVal = month === 12 ? year + 1 : year;
    const endMonth = String(nextMonthVal).padStart(2, '0');

    const partName = `${tableName}_y${year}m${startMonth}`;
    const fromDate = `${year}-${startMonth}-01 00:00:00`;
    const toDate = `${nextYearVal}-${endMonth}-01 00:00:00`;

    return `CREATE TABLE IF NOT EXISTS ${partName} PARTITION OF ${tableName} FOR VALUES FROM ('${fromDate}') TO ('${toDate}');`;
  }

  ensurePartitionsExist(tableName: string, monthsAhead: number = 3): string[] {
    const statements: string[] = [];
    const now = new Date();
    for (let i = 0; i < monthsAhead; i++) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1));
      statements.push(this.generateMonthlyPartitionSql(tableName, d.getUTCFullYear(), d.getUTCMonth() + 1));
    }
    return statements;
  }
}
