export class ViewportRadarScanHud {
  getHudDimensions(viewportWidth: number) {
    const isMobile = viewportWidth < 640;
    return {
      diameterPx: isMobile ? 180 : 280,
      blipScale: isMobile ? 0.8 : 1.2,
      pulseWaveSpeedMs: isMobile ? 1600 : 2200
    };
  }
}
