export class ViewportFocusTrapMobileTouch {
  resolveActiveFocusTarget(isTouchDevice: boolean, initialElementId: string): string | null {
    // On touch devices, do not auto-focus input if it causes virtual keyboard to block modal
    if (isTouchDevice) return null;
    return initialElementId;
  }
}
