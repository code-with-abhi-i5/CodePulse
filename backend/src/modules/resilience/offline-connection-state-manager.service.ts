export type ConnectionState = 'ONLINE' | 'OFFLINE' | 'RECONNECTING';

export interface BufferedAction {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
}

export class OfflineConnectionStateManagerService {
  private state: ConnectionState = 'ONLINE';
  private actionBuffer: BufferedAction[] = [];
  private bannerVisible = false;

  public setOffline(): void {
    this.state = 'OFFLINE';
    this.bannerVisible = true;
  }

  public setOnline(): BufferedAction[] {
    this.state = 'ONLINE';
    this.bannerVisible = false;
    const actions = [...this.actionBuffer];
    this.actionBuffer = [];
    return actions;
  }

  public setReconnecting(): void {
    this.state = 'RECONNECTING';
  }

  public bufferAction(action: Omit<BufferedAction, 'id' | 'timestamp'>): void {
    if (this.state === 'OFFLINE') {
      this.actionBuffer.push({
        id: Math.random().toString(36).substring(2, 9),
        ...action,
        timestamp: Date.now()
      });
    }
  }

  public getState(): ConnectionState {
    return this.state;
  }

  public isBannerVisible(): boolean {
    return this.bannerVisible;
  }

  public getBufferedCount(): number {
    return this.actionBuffer.length;
  }
}
