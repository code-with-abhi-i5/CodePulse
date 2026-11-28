import { SocketGovernorStatus } from '../../types/security';

export class SlowlorisConnectionGovernorService {
  constructor(
    private readonly minTransferRateBytesPerSec: number = 100,
    private readonly maxIdleDurationMs: number = 10000
  ) {}

  public evaluateSocket(
    socketId: string,
    bytesReceived: number,
    durationMs: number
  ): SocketGovernorStatus {
    const seconds = Math.max(durationMs / 1000, 0.001);
    const transferRateBytesPerSec = Math.floor(bytesReceived / seconds);

    if (durationMs >= this.maxIdleDurationMs && transferRateBytesPerSec < this.minTransferRateBytesPerSec) {
      return {
        socketId,
        shouldTerminate: true,
        bytesReceived,
        durationMs,
        transferRateBytesPerSec,
        reason: `Slowloris attack mitigation: Transfer rate ${transferRateBytesPerSec} B/s below threshold ${this.minTransferRateBytesPerSec} B/s after ${durationMs}ms`
      };
    }

    return {
      socketId,
      shouldTerminate: false,
      bytesReceived,
      durationMs,
      transferRateBytesPerSec
    };
  }
}
