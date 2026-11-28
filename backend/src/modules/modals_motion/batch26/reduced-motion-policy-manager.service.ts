export class ReducedMotionPolicyManager {
  resolveAnimationConfig(prefersReducedMotion: boolean, requestedDurationMs = 300) {
    if (prefersReducedMotion) {
      return {
        duration: 0,
        enableTransitions: false,
        timingFunction: 'step-end',
        fallbackStyle: { opacity: 1, transform: 'none' }
      };
    }
    return {
      duration: requestedDurationMs,
      enableTransitions: true,
      timingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      fallbackStyle: {}
    };
  }
}
