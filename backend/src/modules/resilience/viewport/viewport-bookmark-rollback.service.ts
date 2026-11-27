export class ViewportBookmarkRollbackManager {
  computeTouchFriendlyStyles(isMobile = false) {
    return {
      padding: isMobile ? '12px 16px' : '8px 12px',
      minTouchTarget: '44px',
      touchAction: 'manipulation',
      animation: 'slide-down 200ms cubic-bezier(0, 0, 0.2, 1)'
    };
  }
}
