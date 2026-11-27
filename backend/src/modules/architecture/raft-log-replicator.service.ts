export interface LogEntry {
  term: number;
  index: number;
  command: any;
}

export class RaftLogReplicator {
  private currentTerm = 1;
  private log: LogEntry[] = [];
  private commitIndex = 0;

  public append(command: any): LogEntry {
    const index = this.log.length + 1;
    const entry: LogEntry = {
      term: this.currentTerm,
      index,
      command
    };
    this.log.push(entry);
    return entry;
  }

  public handleAppendEntries(term: number, prevLogIndex: number, prevLogTerm: number, entries: LogEntry[]): boolean {
    if (term < this.currentTerm) return false;
    this.currentTerm = term;

    // Check log matching property
    if (prevLogIndex > 0) {
      const prevEntry = this.log[prevLogIndex - 1];
      if (!prevEntry || prevEntry.term !== prevLogTerm) {
        return false;
      }
    }

    // Append new entries
    for (const e of entries) {
      this.log[e.index - 1] = e;
    }
    return true;
  }

  public getCommitIndex(): number {
    return this.commitIndex;
  }

  public getLogLength(): number {
    return this.log.length;
  }
}
