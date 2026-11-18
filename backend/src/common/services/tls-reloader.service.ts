import { Injectable, Logger } from '@nestjs/common';
import * as tls from 'tls';
import * as https from 'https';

export interface TlsReloadResult {
  success: boolean;
  reloadedAt: string;
  activeServerCount: number;
  error?: string;
}

export interface TlsReloaderStatus {
  hasActiveContext: boolean;
  registeredServerCount: number;
  lastReloadedAt: string | null;
  lastError: string | null;
}

@Injectable()
export class TlsReloaderService {
  private readonly logger = new Logger(TlsReloaderService.name);
  private readonly registeredServers = new Set<https.Server | tls.Server>();
  private activeSecureContext: tls.SecureContext | null = null;
  private lastReloadedAt: string | null = null;
  private lastError: string | null = null;

  /**
   * Factory function to create secure context, allowing DI / mocking in unit tests.
   */
  createContext(options: tls.SecureContextOptions): tls.SecureContext {
    return tls.createSecureContext(options);
  }

  /**
   * Register an HTTPS or TLS server to receive zero-downtime credential hot-reloads.
   */
  registerServer(server: https.Server | tls.Server): void {
    this.registeredServers.add(server);
    this.logger.log(
      `Registered server for zero-downtime TLS hot-reloads (total registered: ${this.registeredServers.size})`,
    );

    // If we already have an active secure context, immediately apply it to the new server
    if (
      this.activeSecureContext &&
      typeof (server as unknown as { setSecureContext: (ctx: unknown) => void })
        .setSecureContext === 'function'
    ) {
      try {
        const secureCtx = this.activeSecureContext;
        (
          server as unknown as { setSecureContext: (ctx: unknown) => void }
        ).setSecureContext(secureCtx.context);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Failed to apply existing SecureContext to newly registered server: ${msg}`,
        );
      }
    }
  }

  /**
   * Unregister a previously registered server.
   */
  unregisterServer(server: https.Server | tls.Server): void {
    this.registeredServers.delete(server);
    this.logger.log(
      `Unregistered server from TLS reloader (remaining registered: ${this.registeredServers.size})`,
    );
  }

  /**
   * Hot-swaps TLS credentials in active HTTPS / TLS / WebSocket listeners
   * using secureContext.set / server.setSecureContext without dropping active socket connections.
   */
  reload(certPem: string, keyPem: string, caPem?: string): TlsReloadResult {
    try {
      this.logger.log('Creating fresh SecureContext for TLS hot-reload...');

      const secureContextOptions: tls.SecureContextOptions = {
        cert: certPem,
        key: keyPem,
      };

      if (caPem) {
        secureContextOptions.ca = caPem;
      }

      // Generate the new TLS secure context
      const newSecureContext = this.createContext(secureContextOptions);

      // Hot-swap in every registered server
      let updatedCount = 0;
      const secureCtx = newSecureContext;
      for (const server of this.registeredServers) {
        if (
          typeof (
            server as unknown as { setSecureContext: (ctx: unknown) => void }
          ).setSecureContext === 'function'
        ) {
          (
            server as unknown as { setSecureContext: (ctx: unknown) => void }
          ).setSecureContext(secureCtx.context);
          updatedCount++;
        }
      }

      this.activeSecureContext = newSecureContext;
      this.lastReloadedAt = new Date().toISOString();
      this.lastError = null;

      this.logger.log(
        `Successfully hot-reloaded TLS credentials across ${updatedCount} server listener(s) with zero downtime`,
      );

      return {
        success: true,
        reloadedAt: this.lastReloadedAt,
        activeServerCount: updatedCount,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.lastError = msg;
      this.logger.error(`Zero-downtime TLS reload failed: ${msg}`);

      return {
        success: false,
        reloadedAt: new Date().toISOString(),
        activeServerCount: 0,
        error: msg,
      };
    }
  }

  /**
   * Returns current TLS reloader operational status.
   */
  getStatus(): TlsReloaderStatus {
    return {
      hasActiveContext: this.activeSecureContext !== null,
      registeredServerCount: this.registeredServers.size,
      lastReloadedAt: this.lastReloadedAt,
      lastError: this.lastError,
    };
  }

  /**
   * Get active secure context if loaded.
   */
  getActiveSecureContext(): tls.SecureContext | null {
    return this.activeSecureContext;
  }
}
