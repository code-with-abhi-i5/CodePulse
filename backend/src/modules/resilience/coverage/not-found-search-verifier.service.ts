export class NotFoundQuicklinkSearchVerifier {
  private catalog = [
    { name: 'Tournaments', path: '/tournaments' },
    { name: 'Leaderboard', path: '/leaderboard' },
    { name: 'Coding Challenges', path: '/challenges' },
    { name: 'Battle Arena', path: '/battles' }
  ];

  public search(query: string): { name: string; path: string }[] {
    const q = query.toLowerCase().trim();
    if (!q) return this.catalog.slice(0, 2);
    return this.catalog.filter(c => c.name.toLowerCase().includes(q) || c.path.includes(q));
  }
}
