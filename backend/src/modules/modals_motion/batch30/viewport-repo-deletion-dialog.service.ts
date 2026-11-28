export class ViewportRepoDeletionDialog {
  getLayoutConfig(viewportWidth: number) {
    const isMobile = viewportWidth < 600;
    return {
      dialogPosition: isMobile ? 'bottom-sheet' : 'center',
      confirmButtonFullWidth: isMobile,
      inputFontSize: isMobile ? '16px' : '14px' // prevent auto-zoom on iOS safari
    };
  }
}
