export class ViewportConfettiDensityController {
  resolveDensity(isMobile: boolean, isLowPowerDevice: boolean): number {
    if (isLowPowerDevice) return 20;
    if (isMobile) return 35;
    return 80;
  }
}
