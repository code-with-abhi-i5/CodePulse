export class ViewportReducedMotionPolicy {
  getResponsiveMotionConfig(viewportWidth: number, prefersReducedMotion: boolean) {
    const isMobile = viewportWidth < 768;
    return {
      durationMs: prefersReducedMotion ? 0 : isMobile ? 180 : 300,
      springTension: isMobile ? 120 : 170
    };
  }
}
