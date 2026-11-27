export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

export class GranularErrorBoundaryHandlerService {
  private maxRetries: number;
  private state: ErrorBoundaryState = { hasError: false, retryCount: 0 };

  constructor(maxRetries = 2) {
    this.maxRetries = maxRetries;
  }

  public captureError(error: Error): ErrorBoundaryState {
    this.state = {
      hasError: true,
      error,
      retryCount: this.state.retryCount
    };
    return { ...this.state };
  }

  public retry(): { success: boolean; canRetry: boolean } {
    if (this.state.retryCount >= this.maxRetries) {
      return { success: false, canRetry: false };
    }

    this.state = {
      hasError: false,
      error: undefined,
      retryCount: this.state.retryCount + 1
    };

    return { success: true, canRetry: true };
  }

  public reset(): void {
    this.state = { hasError: false, retryCount: 0 };
  }

  public getState(): ErrorBoundaryState {
    return { ...this.state };
  }
}
