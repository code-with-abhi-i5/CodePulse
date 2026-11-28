export class TouchSwipeBottomSheetController {
  calculateSpringBack(currentY: number, dismissThreshold = 100): { shouldDismiss: boolean; targetY: number } {
    if (currentY >= dismissThreshold) {
      return { shouldDismiss: true, targetY: 400 };
    }
    return { shouldDismiss: false, targetY: 0 };
  }
}
