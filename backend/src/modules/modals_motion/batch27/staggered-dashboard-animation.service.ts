export class StaggeredDashboardAnimation {
  computeCardDelay(index: number, baseDelayMs = 60, maxDelayMs = 600): number {
    const delay = Math.max(0, index) * baseDelayMs;
    return Math.min(maxDelayMs, delay);
  }

  getTransitionStyle(index: number): { transitionDelay: string; transitionTimingFunction: string } {
    const delay = this.computeCardDelay(index);
    return {
      transitionDelay: `${delay}ms`,
      transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)'
    };
  }
}
