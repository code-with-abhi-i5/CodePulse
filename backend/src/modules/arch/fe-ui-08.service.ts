/**
 * Architecture Service: Predictive Route Prefetch Coordinator
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-08]
 */

export class PredictiveRoutePrefetchCoordinatorService {
  private transitionMatrix: Map<string, Map<string, number>>;
  private prefetchedBundles: Set<string>;

  constructor() {
    this.transitionMatrix = new Map();
    this.prefetchedBundles = new Set();
  }

  public recordTransition(fromRoute: string, toRoute: string): void {
    const transitions = this.transitionMatrix.get(fromRoute) || new Map<string, number>();
    const count = transitions.get(toRoute) || 0;
    transitions.set(toRoute, count + 1);
    this.transitionMatrix.set(fromRoute, transitions);
  }

  public predictNextRoutes(currentRoute: string, thresholdProb: number = 0.3): string[] {
    const transitions = this.transitionMatrix.get(currentRoute);
    if (!transitions) return [];

    let total = 0;
    for (const count of transitions.values()) total += count;
    if (total === 0) return [];

    const candidates: Array<{ route: string; prob: number }> = [];
    for (const [route, count] of transitions.entries()) {
      const prob = count / total;
      if (prob >= thresholdProb) {
        candidates.push({ route, prob });
      }
    }

    return candidates.sort((a, b) => b.prob - a.prob).map(c => c.route);
  }

  public getPrefetchTargets(currentRoute: string): string[] {
    const predicted = this.predictNextRoutes(currentRoute);
    const needed = predicted.filter(r => !this.prefetchedBundles.has(r));
    needed.forEach(r => this.prefetchedBundles.add(r));
    return needed;
  }
}
