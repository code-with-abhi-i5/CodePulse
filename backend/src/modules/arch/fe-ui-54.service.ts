/**
 * Architecture Service: Accessible Data Table
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-54]
 */

export type SortDirection = 'ascending' | 'descending' | 'none';

export interface TableRow {
  id: string;
  [key: string]: any;
}

export class AccessibleDataTableService<T extends TableRow> {
  private data: T[];
  private sortColumn: keyof T | null;
  private sortDirection: SortDirection;

  constructor(data: T[] = []) {
    this.data = data;
    this.sortColumn = null;
    this.sortDirection = 'none';
  }

  public setData(data: T[]): void {
    this.data = data;
  }

  public sort(column: keyof T): SortDirection {
    if (this.sortColumn !== column) {
      this.sortColumn = column;
      this.sortDirection = 'ascending';
    } else {
      this.sortDirection = this.sortDirection === 'ascending' ? 'descending' : this.sortDirection === 'descending' ? 'none' : 'ascending';
    }

    if (this.sortDirection === 'none') {
      this.sortColumn = null;
    }
    return this.sortDirection;
  }

  public getSortedData(): T[] {
    if (!this.sortColumn || this.sortDirection === 'none') {
      return [...this.data];
    }
    const col = this.sortColumn;
    const dir = this.sortDirection === 'ascending' ? 1 : -1;
    return [...this.data].sort((a, b) => {
      const vA = a[col];
      const vB = b[col];
      if (vA < vB) return -1 * dir;
      if (vA > vB) return 1 * dir;
      return 0;
    });
  }

  public getAriaSort(column: keyof T): 'ascending' | 'descending' | 'none' {
    if (this.sortColumn === column) {
      return this.sortDirection;
    }
    return 'none';
  }

  public getAriaLiveAnnouncement(): string {
    if (!this.sortColumn || this.sortDirection === 'none') {
      return 'Table sorted in default order.';
    }
    return `Table sorted by ${String(this.sortColumn)} ${this.sortDirection}.`;
  }
}
