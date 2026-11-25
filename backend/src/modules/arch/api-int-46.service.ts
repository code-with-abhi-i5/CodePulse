/**
 * Architecture Service: gRPC Channel Connectivity State Listener
 * Subsystem: RPC Health Monitoring & Disconnect Alerting
 */

export type ChannelState = 'IDLE' | 'CONNECTING' | 'READY' | 'TRANSIENT_FAILURE' | 'SHUTDOWN';

export class GrpcConnectivityStateMonitorService {
  private readonly channelStates = new Map<string, ChannelState>();

  public updateState(channelId: string, newState: ChannelState): { stateChanged: boolean; alertRequired: boolean } {
    const oldState = this.channelStates.get(channelId);
    this.channelStates.set(channelId, newState);

    const stateChanged = oldState !== newState;
    const alertRequired = newState === 'TRANSIENT_FAILURE' && stateChanged;
    return { stateChanged, alertRequired };
  }

  public getState(channelId: string): ChannelState {
    return this.channelStates.get(channelId) || 'IDLE';
  }
}
