export class ViewportAuthRefreshInterceptor {
  getRefreshLoaderConfig(isMobile: boolean) {
    return {
      type: isMobile ? 'top-bar-spinner' : 'modal-toast',
      nonBlocking: isMobile,
      zIndex: 9999,
      ariaLabel: 'Refreshing session credentials'
    };
  }
}
