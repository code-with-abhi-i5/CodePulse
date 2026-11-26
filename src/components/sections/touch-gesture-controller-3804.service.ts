export class MobileTouchGestureControllerService_3804 {
  private zoomLevel: number = 1.0;
  public calculatePinchZoom(distStart: number, distCurrent: number): number {
    if (distStart <= 0) return this.zoomLevel;
    const ratio = distCurrent / distStart;
    this.zoomLevel = Math.max(0.5, Math.min(3.0, ratio));
    return this.zoomLevel;
  }
  public getZoom(): number { return this.zoomLevel; }
}