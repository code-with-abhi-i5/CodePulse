export class WcagBookmarkAnnouncer {
  public formatAnnouncement(title: string, isBookmarked: boolean, hasError = false): {
    ariaLive: string;
    ariaAtomic: boolean;
    announcement: string;
  } {
    if (hasError) {
      return {
        ariaLive: 'assertive',
        ariaAtomic: true,
        announcement: `Error saving bookmark for ${title}. Reverted to previous state.`
      };
    }
    return {
      ariaLive: 'polite',
      ariaAtomic: true,
      announcement: isBookmarked ? `${title} added to bookmarks.` : `${title} removed from bookmarks.`
    };
  }
}
