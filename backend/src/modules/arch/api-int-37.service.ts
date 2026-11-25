/**
 * Architecture Service: HTTP/2 Asset Preload Coordinator
 * Subsystem: Web Optimization & Asset Preloading
 */

export class Http2ServerPushCoordinatorService {
  private readonly routePreloads = new Map<string, string[]>(); // routePrefix -> assetUrls

  public registerPreloads(routePrefix: string, assetUrls: string[]): void {
    this.routePreloads.set(routePrefix, assetUrls);
  }

  public getPreloadHeader(path: string): string | null {
    for (const [prefix, assets] of this.routePreloads.entries()) {
      if (path.startsWith(prefix)) {
        return assets.map(url => `<${url}>; rel=preload; as=script`).join(', ');
      }
    }
    return null;
  }
}
