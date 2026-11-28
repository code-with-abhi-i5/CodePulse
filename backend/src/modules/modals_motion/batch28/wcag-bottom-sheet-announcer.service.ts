export class WcagBottomSheetAnnouncer {
  getAnnounceMessage(state: 'opened' | 'dragging' | 'dismissed'): { message: string; ariaLive: 'polite' | 'assertive' } {
    switch (state) {
      case 'opened':
        return { message: 'Bottom drawer opened. Swipe down or press Escape to close.', ariaLive: 'polite' };
      case 'dragging':
        return { message: 'Dragging drawer downwards', ariaLive: 'polite' };
      case 'dismissed':
        return { message: 'Bottom drawer closed', ariaLive: 'polite' };
    }
  }
}
