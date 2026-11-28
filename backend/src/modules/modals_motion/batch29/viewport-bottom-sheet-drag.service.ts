export class ViewportBottomSheetDrag {
  getDragConstraints(viewportHeight: number) {
    return {
      maxDragY: Math.floor(viewportHeight * 0.7),
      dismissThresholdY: Math.floor(viewportHeight * 0.25),
      touchTargetMinHeightPx: 48
    };
  }
}
