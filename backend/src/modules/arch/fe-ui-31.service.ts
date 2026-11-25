/**
 * Architecture Service: Client Error Boundary Reporter
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-31]
 */

export interface Breadcrumb {
  category: 'NAVIGATION' | 'UI_CLICK' | 'NETWORK';
  message: string;
  timestamp: number;
}

export interface CrashReport {
  errorName: string;
  errorMessage: string;
  componentStack: string;
  breadcrumbs: Breadcrumb[];
  timestamp: number;
}

export class ClientErrorBoundaryService {
  private breadcrumbs: Breadcrumb[];
  private maxBreadcrumbs: number;

  constructor(maxBreadcrumbs: number = 20) {
    this.maxBreadcrumbs = maxBreadcrumbs;
    this.breadcrumbs = [];
  }

  public addBreadcrumb(category: 'NAVIGATION' | 'UI_CLICK' | 'NETWORK', message: string): void {
    if (this.breadcrumbs.length >= this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
    this.breadcrumbs.push({ category, message, timestamp: Date.now() });
  }

  public generateCrashReport(error: Error, componentStack: string): CrashReport {
    return {
      errorName: error.name,
      errorMessage: error.message,
      componentStack,
      breadcrumbs: [...this.breadcrumbs],
      timestamp: Date.now()
    };
  }
}
