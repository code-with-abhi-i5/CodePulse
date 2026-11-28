export class FocusTrapCoverageVerifier {
  verifyCycle(elementCount: number, fromIndex: number, toIndex: number, isShift: boolean): boolean {
    if (elementCount === 0) return toIndex === -1;
    if (isShift) {
      const expected = fromIndex === 0 ? elementCount - 1 : fromIndex - 1;
      return toIndex === expected;
    }
    const expected = fromIndex === elementCount - 1 ? 0 : fromIndex + 1;
    return toIndex === expected;
  }
}
