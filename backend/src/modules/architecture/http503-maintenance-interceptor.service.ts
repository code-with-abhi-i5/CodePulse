export interface MaintenanceConfig {
  maintenancePath: string;
  defaultRetryAfterSec: number;
}

export interface InterceptResult {
  isMaintenance: boolean;
  redirectUrl?: string;
  retryAfterSeconds?: number;
  message?: string;
}

export class Http503MaintenanceInterceptorService {
  private config: MaintenanceConfig;

  constructor(config: Partial<MaintenanceConfig> = {}) {
    this.config = {
      maintenancePath: config.maintenancePath || '/maintenance',
      defaultRetryAfterSec: config.defaultRetryAfterSec || 300
    };
  }

  public interceptResponse(
    statusCode: number,
    headers: Record<string, string | undefined> = {},
    body?: any
  ): InterceptResult {
    if (statusCode !== 503) {
      return { isMaintenance: false };
    }

    const retryAfterHeader = headers['retry-after'] || headers['RETRY-AFTER'];
    let retryAfterSeconds = this.config.defaultRetryAfterSec;

    if (retryAfterHeader) {
      const parsed = parseInt(retryAfterHeader, 10);
      if (!isNaN(parsed) && parsed > 0) {
        retryAfterSeconds = parsed;
      }
    }

    const message = body?.message || 'Platform undergoing scheduled maintenance. Please retry shortly.';

    return {
      isMaintenance: true,
      redirectUrl: `${this.config.maintenancePath}?retry_after=${retryAfterSeconds}`,
      retryAfterSeconds,
      message
    };
  }
}
