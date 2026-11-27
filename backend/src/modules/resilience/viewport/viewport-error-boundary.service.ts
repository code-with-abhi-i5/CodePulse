export class ViewportErrorBoundary {
  getFallbackCardLayout(viewportWidth: number) {
    const isMobile = viewportWidth < 600;
    return {
      padding: isMobile ? '16px' : '32px',
      fontSize: isMobile ? '14px' : '16px',
      buttonFlexDirection: isMobile ? 'column' : 'row',
      fullWidthButton: isMobile
    };
  }
}
