/**
 * Architecture Service: TCP No-Delay Socket Option Configurator
 * Subsystem: Advanced System Performance & Scalability [PERF-SCALE-39]
 */

export interface SocketLike {
  setNoDelay(noDelay?: boolean): any;
  setKeepAlive(enable?: boolean, initialDelay?: number): any;
  setTimeout(timeout?: number, callback?: () => void): any;
}

export interface SocketConfigOptions {
  noDelay?: boolean;
  keepAlive?: boolean;
  keepAliveDelayMs?: number;
  timeoutMs?: number;
}

export class TcpNoDelayConfiguratorService {
  private configuredCount: number;

  constructor() {
    this.configuredCount = 0;
  }

  public configureSocket(socket: SocketLike, options?: SocketConfigOptions): boolean {
    if (!socket || typeof socket.setNoDelay !== 'function') {
      return false;
    }

    const noDelay = options?.noDelay ?? true;
    const keepAlive = options?.keepAlive ?? true;
    const keepAliveDelay = options?.keepAliveDelayMs ?? 10000;
    const timeoutMs = options?.timeoutMs ?? 30000;

    socket.setNoDelay(noDelay);
    if (typeof socket.setKeepAlive === 'function') {
      socket.setKeepAlive(keepAlive, keepAliveDelay);
    }
    if (typeof socket.setTimeout === 'function') {
      socket.setTimeout(timeoutMs);
    }

    this.configuredCount++;
    return true;
  }

  public getConfiguredCount(): number {
    return this.configuredCount;
  }
}
