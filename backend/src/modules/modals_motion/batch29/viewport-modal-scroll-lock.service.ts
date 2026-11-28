export class ViewportModalScrollLock {
  getScrollLockProperties(isMobileTouchDevice: boolean) {
    return {
      bodyPosition: isMobileTouchDevice ? 'fixed' : 'static',
      bodyWidth: isMobileTouchDevice ? '100%' : 'auto',
      bodyOverflow: 'hidden'
    };
  }
}
