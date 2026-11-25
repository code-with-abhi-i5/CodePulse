import { Injectable } from '@nestjs/common';
import { FairTierJob } from '../../types/queues';

@Injectable()
export class FairSchedulerService {
  private readonly queues = {
    enterprise: [] as any[],
    pro: [] as any[],
    free: [] as any[],
  };
  private readonly weights = { enterprise: 3, pro: 2, free: 1 };
  private roundDeficit = { enterprise: 0, pro: 0, free: 0 };

  enqueue(tier: 'enterprise' | 'pro' | 'free', job: any): void {
    this.queues[tier].push(job);
  }

  dequeueNext(): FairTierJob | null {
    const tiers: Array<'enterprise' | 'pro' | 'free'> = ['enterprise', 'pro', 'free'];
    
    for (const tier of tiers) {
      if (this.queues[tier].length > 0 && this.roundDeficit[tier] < this.weights[tier]) {
        this.roundDeficit[tier]++;
        const job = this.queues[tier].shift();
        return { tier, job };
      }
    }

    this.roundDeficit = { enterprise: 0, pro: 0, free: 0 };
    for (const tier of tiers) {
      if (this.queues[tier].length > 0) {
        this.roundDeficit[tier]++;
        const job = this.queues[tier].shift();
        return { tier, job };
      }
    }

    return null;
  }

  getTierDepths(): { enterprise: number; pro: number; free: number } {
    return {
      enterprise: this.queues.enterprise.length,
      pro: this.queues.pro.length,
      free: this.queues.free.length,
    };
  }
}
