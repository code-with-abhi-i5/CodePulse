/**
 * Architecture Service: Accessible Screen Reader Announcer Queue
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-28]
 */

export interface Announcement {
  id: string;
  message: string;
  politeness: 'polite' | 'assertive';
  queuedAt: number;
}

export class AccessibleScreenReaderAnnouncerService {
  private queue: Announcement[];
  private isAnnouncing: boolean;

  constructor() {
    this.queue = [];
    this.isAnnouncing = false;
  }

  public enqueue(message: string, politeness: 'polite' | 'assertive' = 'polite'): Announcement {
    const announcement: Announcement = {
      id: 'ann_' + Math.random().toString(36).substring(2, 8),
      message,
      politeness,
      queuedAt: Date.now()
    };

    if (politeness === 'assertive') {
      // High priority: insert ahead of polite announcements
      const firstPoliteIdx = this.queue.findIndex(a => a.politeness === 'polite');
      if (firstPoliteIdx >= 0) {
        this.queue.splice(firstPoliteIdx, 0, announcement);
      } else {
        this.queue.push(announcement);
      }
    } else {
      this.queue.push(announcement);
    }

    return announcement;
  }

  public popNext(): Announcement | null {
    if (this.queue.length === 0) return null;
    return this.queue.shift() || null;
  }

  public getQueueLength(): number {
    return this.queue.length;
  }
}
