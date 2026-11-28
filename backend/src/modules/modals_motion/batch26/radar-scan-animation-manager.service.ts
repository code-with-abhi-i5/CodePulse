export class RadarScanAnimationManager {
  computeRadarParams(elapsedMs: number, periodMs = 2400) {
    const cycle = (elapsedMs % periodMs) / periodMs;
    const angleDeg = Math.floor(cycle * 360);
    const pulseOpacity = (1 - cycle) * 0.8;
    const ringScale = 1 + cycle * 1.5;

    return {
      angleDeg,
      pulseOpacity: Math.max(0, pulseOpacity),
      ringScale,
      transform: `rotate(${angleDeg}deg)`
    };
  }
}
