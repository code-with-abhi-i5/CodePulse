/**
 * Architecture Service: Virtualized Infinite Scroll Leaderboard Table
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-14]
 */

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  rating: number;
}

export class VirtualizedLeaderboardTableService {
  private rowHeight: number;
  private containerHeight: number;

  constructor(rowHeight: number = 40, containerHeight: number = 400) {
    this.rowHeight = rowHeight;
    this.containerHeight = containerHeight;
  }

  public getVirtualWindow(scrollTop: number, totalRows: number): { startIndex: number; endIndex: number; offsetY: number } {
    const startIndex = Math.max(0, Math.floor(scrollTop / this.rowHeight));
    const visibleCount = Math.ceil(this.containerHeight / this.rowHeight);
    const endIndex = Math.min(totalRows - 1, startIndex + visibleCount + 2); // 2 rows buffer

    return {
      startIndex,
      endIndex,
      offsetY: startIndex * this.rowHeight
    };
  }

  public sliceRows(entries: LeaderboardEntry[], scrollTop: number): { rows: LeaderboardEntry[]; offsetY: number } {
    const { startIndex, endIndex, offsetY } = this.getVirtualWindow(scrollTop, entries.length);
    if (entries.length === 0) return { rows: [], offsetY: 0 };
    return {
      rows: entries.slice(startIndex, endIndex + 1),
      offsetY
    };
  }
}
