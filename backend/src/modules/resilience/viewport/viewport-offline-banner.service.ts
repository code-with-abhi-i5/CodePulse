export class ViewportOfflineBanner {
  getBannerPlacement(viewportHeight: number, hasNotch = false) {
    return {
      position: 'fixed',
      top: hasNotch ? 'calc(env(safe-area-inset-top) + 8px)' : '8px',
      width: 'calc(100% - 24px)',
      left: '12px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
    };
  }
}
