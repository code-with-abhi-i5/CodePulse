export class DarkStaggeredDashboardCards {
  getCardStyles(index: number) {
    return {
      backgroundColor: '#1e293b',
      borderColor: '#334155',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
      animationDelay: `${index * 75}ms`
    };
  }
}
