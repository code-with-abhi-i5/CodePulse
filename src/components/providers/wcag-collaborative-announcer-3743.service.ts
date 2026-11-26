export interface Announcement { user: string; line: number; col: number; message: string; timestamp: number; }
export class WcagCollaborativeAnnouncerService_3743 {
  private history: Announcement[] = [];
  public announceCursor(user: string, line: number, col: number): Announcement {
    const ann: Announcement = { user, line, col, message: `User ${user} navigated to line ${line}, column ${col}`, timestamp: Date.now() };
    this.history.push(ann);
    return ann;
  }
  public getLatest(): Announcement | undefined { return this.history[this.history.length - 1]; }
}