export class AxiosAuthRefreshInterceptorVerifier {
  private inFlightRefresh: Promise<string> | null = null;
  private requestQueue: (() => void)[] = [];

  public async acquireToken(refreshFn: () => Promise<string>): Promise<string> {
    if (!this.inFlightRefresh) {
      this.inFlightRefresh = refreshFn().finally(() => {
        this.inFlightRefresh = null;
      });
    }
    return this.inFlightRefresh;
  }

  public getInFlightState(): boolean {
    return this.inFlightRefresh !== null;
  }
}
