export class ViewportEscapeListenerTouch {
  shouldHandleDismissal(event: { key?: string; isBackdropTouch?: boolean }): boolean {
    if (event.key === 'Escape') return true;
    if (event.isBackdropTouch) return true;
    return false;
  }
}
