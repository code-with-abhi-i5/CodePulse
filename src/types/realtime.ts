/**
 * Shared Realtime Collaboration and WebSocket Types for CodePulse
 */

export interface CrdtUpdateMessage {
  documentId: string;
  updateVector: number[];
  clientId: string;
  clock: number;
}

export interface PresenceCursor {
  userId: string;
  roomId: string;
  line: number;
  column: number;
  updatedAt: number;
}

export interface RoomMeshEvent {
  eventId: string;
  roomId: string;
  originRegion: 'aws-us-east' | 'aws-eu-west' | 'gcp-asia-south';
  eventType: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

export interface WebrtcSession {
  peerId: string;
  roomId: string;
  sdp: string;
  bitrateKbps: number;
  codec: 'opus' | 'g711';
}

export interface ReplayEvent {
  sequenceNumber: number;
  matchId: string;
  eventType: string;
  timestamp: number;
  payload: Record<string, unknown>;
}

export interface ReconnectState {
  clientId: string;
  retryAttempt: number;
  backoffMs: number;
  queueLength: number;
}

export interface BackpressureState {
  socketId: string;
  bufferedBytes: number;
  lagMs: number;
  isPaused: boolean;
}

export interface HeartbeatSession {
  socketId: string;
  lastPingAt: number;
  missedPings: number;
  isHealthy: boolean;
}

export interface SpectatorNode {
  nodeId: string;
  roomId: string;
  viewerCount: number;
  capacity: number;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  text: string;
  flagged: boolean;
  timestamp: number;
}
