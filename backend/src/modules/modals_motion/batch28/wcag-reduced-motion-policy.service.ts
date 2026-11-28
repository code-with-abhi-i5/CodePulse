export class WcagReducedMotionPolicy {
  getA11yTransitionProps(reducedMotion: boolean) {
    return {
      'aria-live': 'polite',
      animationDuration: reducedMotion ? '0.001ms' : '250ms',
      role: 'region'
    };
  }
}
