/**
 * Architecture Service: Browser Asset Preloading Coordinator (HTTP 103 Early Hints)
 * Subsystem: Advanced System Performance & Scalability [PERF-SCALE-37]
 */

export interface PreloadAsset {
  url: string;
  as: 'style' | 'script' | 'font' | 'image';
  crossorigin?: boolean;
}

export class EarlyHintsCoordinatorService {
  private routeMap: Map<string, PreloadAsset[]>;

  constructor() {
    this.routeMap = new Map();
  }

  public registerRouteAssets(routePattern: string, assets: PreloadAsset[]): void {
    this.routeMap.set(routePattern, assets);
  }

  public getPreloadLinks(route: string): string[] {
    const assets = this.routeMap.get(route) || [];
    return assets.map(a => {
      let link = '<' + a.url + '>; rel=preload; as=' + a.as;
      if (a.crossorigin || a.as === 'font') {
        link += '; crossorigin';
      }
      return link;
    });
  }

  public formatEarlyHintsHeaders(route: string): Record<string, string[]> | null {
    const links = this.getPreloadLinks(route);
    if (links.length === 0) return null;
    return {
      'Link': links
    };
  }
}
