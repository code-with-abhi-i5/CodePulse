import { Injectable, Logger } from '@nestjs/common';
import { WebrtcSession } from '../../../src/types/realtime';

@Injectable()
export class WebrtcVoiceService {
  private readonly logger = new Logger(WebrtcVoiceService.name);
  private sessions: Map<string, WebrtcSession> = new Map();

  public negotiatePeer(peerId: string, roomId: string, sdp: string): WebrtcSession {
    const session: WebrtcSession = {
      peerId,
      roomId,
      sdp,
      bitrateKbps: 32, // Optimal for Opus speech
      codec: 'opus'
    };
    this.sessions.set(peerId, session);
    return session;
  }

  public adaptBitrate(peerId: string, packetLossPercent: number): number {
    const session = this.sessions.get(peerId);
    if (!session) return 32;

    if (packetLossPercent > 10) {
      session.bitrateKbps = 16; // Low bitrate adaptation
    } else if (packetLossPercent < 2) {
      session.bitrateKbps = 48; // High quality
    }
    return session.bitrateKbps;
  }

  public terminateSession(peerId: string): boolean {
    return this.sessions.delete(peerId);
  }
}
