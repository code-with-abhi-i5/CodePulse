export interface QuickLinkRoute {
  path: string;
  title: string;
  category: string;
}

export class NotFoundQuicklinksResolverService {
  private routes: QuickLinkRoute[] = [
    { path: '/challenges', title: 'Coding Challenges', category: 'Coding' },
    { path: '/battles', title: 'Live Code Battles', category: 'Competitive' },
    { path: '/tournaments', title: 'Tournaments', category: 'Competitive' },
    { path: '/leaderboard', title: 'Leaderboards', category: 'Stats' },
    { path: '/settings', title: 'User Settings', category: 'Account' },
    { path: '/profile', title: 'Developer Profile', category: 'Account' }
  ];

  private levenshtein(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  public resolveSuggestions(requestedPath: string, limit = 3): QuickLinkRoute[] {
    const cleaned = requestedPath.toLowerCase().trim();
    if (!cleaned) return this.routes.slice(0, limit);

    const scored = this.routes.map(r => ({
      route: r,
      dist: this.levenshtein(cleaned, r.path)
    }));

    scored.sort((a, b) => a.dist - b.dist);
    return scored.slice(0, limit).map(s => s.route);
  }
}
