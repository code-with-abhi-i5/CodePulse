import { Injectable } from '@nestjs/common';

@Injectable()
export class SentinelFailoverService {
  private activeMaster: string = 'redis-master.internal:6379';
  private readonly sentinels: Set<string> = new Set();
  private readonly subscriptions: Set<string> = new Set();

  registerSentinel(sentinelUrl: string): void {
    this.sentinels.add(sentinelUrl);
  }

  subscribeChannel(channel: string): void {
    this.subscriptions.add(channel);
  }

  getActiveMaster(): string {
    return this.activeMaster;
  }

  handleFailoverEvent(newMaster: string): { previousMaster: string; newMaster: string; reconnectedSubs: number } {
    const prev = this.activeMaster;
    this.activeMaster = newMaster;
    return {
      previousMaster: prev,
      newMaster,
      reconnectedSubs: this.subscriptions.size,
    };
  }
}
