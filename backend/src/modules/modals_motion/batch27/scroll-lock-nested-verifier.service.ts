export class ScrollLockNestedVerifier {
  verifyInvariant(activeDialogCount: number, bodyOverflowStyle: string): boolean {
    if (activeDialogCount > 0) {
      return bodyOverflowStyle === 'hidden';
    }
    return bodyOverflowStyle === 'unset' || bodyOverflowStyle === '';
  }
}
