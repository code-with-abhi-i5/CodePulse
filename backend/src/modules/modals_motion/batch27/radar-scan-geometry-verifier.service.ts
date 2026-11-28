export class RadarScanGeometryVerifier {
  verifyAngleBounds(angleDeg: number): boolean {
    return angleDeg >= 0 && angleDeg < 360;
  }
}
