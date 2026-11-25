import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class FairSchedulerService {
  constructor() {
    this.queues = { enterprise: [], pro: [], free: [] };
    this.weights = { enterprise: 3, pro: 2, free: 1 };
    this.roundDeficit = { enterprise: 0, pro: 0, free: 0 };
  }

  enqueue(tier, job) {
    this.queues[tier].push(job);
  }

  dequeueNext() {
    const tiers = ['enterprise', 'pro', 'free'];
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

  getTierDepths() {
    return {
      enterprise: this.queues.enterprise.length,
      pro: this.queues.pro.length,
      free: this.queues.free.length,
    };
  }
}

describe('FairSchedulerService', () => {
  it('schedules across multi-tier queues preventing starvation', () => {
    const service = new FairSchedulerService();
    service.enqueue('enterprise', 'ent-1');
    service.enqueue('enterprise', 'ent-2');
    service.enqueue('enterprise', 'ent-3');
    service.enqueue('enterprise', 'ent-4');
    service.enqueue('free', 'free-1');

    const dequeued = [];
    for (let i = 0; i < 4; i++) {
      dequeued.push(service.dequeueNext());
    }
    const hasFree = dequeued.some(d => d.tier === 'free');
    assert.equal(hasFree, true);
  });
});
