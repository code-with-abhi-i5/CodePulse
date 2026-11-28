export class BottomSheetVelocityVerifier {
  isFlickDismiss(velocityY: number, minVelocityThreshold = 0.6): boolean {
    return velocityY >= minVelocityThreshold;
  }
}
