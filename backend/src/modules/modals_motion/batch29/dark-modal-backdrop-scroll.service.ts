export class DarkModalBackdropScroll {
  getBackdropStyle(isOpen: boolean) {
    return {
      backgroundColor: isOpen ? 'rgba(0, 0, 0, 0.75)' : 'transparent',
      backdropFilter: isOpen ? 'blur(4px)' : 'none',
      overflow: isOpen ? 'hidden' : 'auto'
    };
  }
}
