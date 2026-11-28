export class MotionReducedQueryListener {
  isReducedMotionPreferred(mediaQueryResult: boolean): boolean {
    return Boolean(mediaQueryResult);
  }
}
