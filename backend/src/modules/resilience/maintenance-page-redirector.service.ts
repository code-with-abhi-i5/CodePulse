export interface MaintenanceStatus {
  isMaintenance: boolean;
  retryAfterSec: number;
  redirectUrl?: string;
  maintenanceWindow?: string;
}

export class MaintenancePageRedirectorService {
  public parseStatus(statusCode: number, headers: Record<string, string | undefined> = {}): MaintenanceStatus {
    if (statusCode !== 503) {
      return { isMaintenance: false, retryAfterSec: 0 };
    }

    const retryHeader = headers['retry-after'] || headers['RETRY-AFTER'];
    const retryAfterSec = retryHeader ? Math.max(30, parseInt(retryHeader, 10) || 300) : 300;
    const maintenanceWindow = headers['x-maintenance-window'] || 'Routine platform upgrades';

    return {
      isMaintenance: true,
      retryAfterSec,
      redirectUrl: '/maintenance?retry_after=' + retryAfterSec,
      maintenanceWindow
    };
  }
}
