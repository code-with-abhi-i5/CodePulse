export class ViewportAchievementShareDialog {
  getLayout(viewportWidth: number) {
    const isMobile = viewportWidth < 600;
    return {
      mode: isMobile ? 'bottom-sheet' : 'center-modal',
      width: isMobile ? '100%' : '440px',
      showNativeShareButton: isMobile
    };
  }
}
