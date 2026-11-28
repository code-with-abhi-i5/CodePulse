export class ViewportStaggeredDashboardLayout {
  getGridColumns(viewportWidth: number): number {
    if (viewportWidth < 640) return 1;
    if (viewportWidth < 1024) return 2;
    return 3;
  }
}
