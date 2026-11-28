export class BottomSheetDragGestureHandler {
  evaluateDismissal(deltaY: number, velocityY: number, thresholdPx = 120, velocityThreshold = 0.5): boolean {
    if (deltaY <= 0) return false; // dragged upwards
    return deltaY >= thresholdPx || velocityY >= velocityThreshold;
  }

  computeTransform(deltaY: number): string {
    const clamped = Math.max(0, deltaY);
    return `translateY(${clamped}px)`;
  }
}
