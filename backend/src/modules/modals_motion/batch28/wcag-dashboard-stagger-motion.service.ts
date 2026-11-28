export class WcagDashboardStaggerMotion {
  getAccessibleStyle(index: number, prefersReducedMotion: boolean) {
    if (prefersReducedMotion) {
      return {
        opacity: 1,
        transform: 'none',
        transition: 'none'
      };
    }
    return {
      opacity: 0,
      transform: 'translateY(16px)',
      transition: `opacity 300ms ease ${index * 60}ms, transform 300ms cubic-bezier(0.2, 0.8, 0.2, 1) ${index * 60}ms`
    };
  }
}
