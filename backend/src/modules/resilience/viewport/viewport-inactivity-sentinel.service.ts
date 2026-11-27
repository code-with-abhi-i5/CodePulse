export class ViewportInactivitySentinel {
  getModalLayout(viewportWidth: number) {
    const isMobile = viewportWidth < 640;
    const isTablet = viewportWidth >= 640 && viewportWidth < 1024;
    return {
      width: isMobile ? '92vw' : isTablet ? '480px' : '420px',
      bottomSheet: isMobile,
      position: isMobile ? 'fixed-bottom' : 'center',
      safeAreaInsets: isMobile ? 'env(safe-area-inset-bottom)' : '0px'
    };
  }
}
