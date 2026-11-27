export interface ScheduledJob<T = any> {
  id: string;
  payload: T;
  priority: number; // Base priority: 1 to 100
  enqueuedAt: number;
}

export class PriorityJobQueueLotteryScheduler<T = any> {
  private jobs: ScheduledJob<T>[] = [];
  private agingRate: number; // Bonus tickets per ms waiting

  constructor(agingRate = 0.001) {
    this.agingRate = agingRate;
  }

  public enqueue(job: Omit<ScheduledJob<T>, 'enqueuedAt'>): void {
    this.jobs.push({
      ...job,
      enqueuedAt: Date.now()
    });
  }

  public selectNextJob(): ScheduledJob<T> | null {
    if (this.jobs.length === 0) return null;

    const now = Date.now();
    // Calculate tickets for each job: priority + (age * agingRate)
    const ticketWeights = this.jobs.map(j => {
      const ageMs = now - j.enqueuedAt;
      return Math.max(1, j.priority + ageMs * this.agingRate);
    });

    const totalTickets = ticketWeights.reduce((a, b) => a + b, 0);
    const winningTicket = Math.random() * totalTickets;

    let cumulative = 0;
    for (let i = 0; i < this.jobs.length; i++) {
      cumulative += ticketWeights[i];
      if (winningTicket <= cumulative) {
        const [selected] = this.jobs.splice(i, 1);
        return selected;
      }
    }

    return this.jobs.pop() || null;
  }

  public size(): number {
    return this.jobs.length;
  }
}
