export class NotFoundQuicklinkResolver {
  private registeredRoutes = [
    '/dashboard',
    '/challenges',
    '/leaderboard',
    '/battles',
    '/settings',
    '/bounties',
    '/profile'
  ];

  findSuggestedLinks(attemptedPath: string, limit = 3): string[] {
    if (!attemptedPath) return this.registeredRoutes.slice(0, limit);
    const cleaned = attemptedPath.toLowerCase().replace(/[^a-z0-9]/g, '');
    const scored = this.registeredRoutes.map(route => {
      const routeClean = route.replace(/\//g, '');
      let score = 0;
      if (routeClean.includes(cleaned) || cleaned.includes(routeClean)) score += 5;
      for (const char of cleaned) {
        if (routeClean.includes(char)) score += 1;
      }
      return { route, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map(s => s.route);
  }
}
