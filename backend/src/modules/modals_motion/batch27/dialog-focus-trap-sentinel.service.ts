export class DialogFocusTrapSentinel {
  resolveNextFocus(focusableElements: string[], currentIndex: number, isShiftTab: boolean): number {
    if (!focusableElements || focusableElements.length === 0) return -1;
    if (isShiftTab) {
      return currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
    }
    return currentIndex >= focusableElements.length - 1 ? 0 : currentIndex + 1;
  }
}
