import { Injectable, Logger } from '@nestjs/common';

export interface TrackedSocket {
  socketId: string;
  namespace: string;
  connectedAt: Date;
  disconnectedAt?: Date;
  rooms: Set<string>;
  listenerCounts: Map<string, number>;
  isAlive: boolean;
}

@Injectable()
export class ClientTrackerService {
  private readonly logger = new Logger(ClientTrackerService.name);
  private readonly socketRegistry = new Map<string, TrackedSocket>();

  /**
   * Registers a newly connected socket.
   */
  public registerSocket(socketId: string, namespace = '/'): TrackedSocket {
    const socket: TrackedSocket = {
      socketId,
      namespace,
      connectedAt: new Date(),
      rooms: new Set(['/#' + socketId]),
      listenerCounts: new Map(),
      isAlive: true,
    };

    this.socketRegistry.set(socketId, socket);
    return socket;
  }

  /**
   * Tracks an event listener added to a socket.
   */
  public trackEventListener(socketId: string, eventName: string): void {
    const socket = this.socketRegistry.get(socketId);
    if (socket) {
      const cur = socket.listenerCounts.get(eventName) || 0;
      socket.listenerCounts.set(eventName, cur + 1);
    }
  }

  /**
   * Marks a socket as disconnected.
   */
  public markDisconnected(socketId: string): void {
    const socket = this.socketRegistry.get(socketId);
    if (socket) {
      socket.isAlive = false;
      socket.disconnectedAt = new Date();
    }
  }

  /**
   * Removes a socket completely from the pool upon full cleanup.
   */
  public purgeSocket(socketId: string): void {
    this.socketRegistry.delete(socketId);
  }

  public getTrackedSockets(): TrackedSocket[] {
    return Array.from(this.socketRegistry.values());
  }

  public getSocket(socketId: string): TrackedSocket | undefined {
    return this.socketRegistry.get(socketId);
  }

  public getPoolSize(): number {
    return this.socketRegistry.size;
  }
}
