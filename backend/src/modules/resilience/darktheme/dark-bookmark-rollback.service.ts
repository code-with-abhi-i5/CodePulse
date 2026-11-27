export class DarkThemeBookmarkRollbackManager {
  public getBadgeStyle(isBookmarked: boolean): { bg: string; text: string; border: string } {
    return isBookmarked
      ? { bg: '#1E293B', text: '#38BDF8', border: '1px solid #0284C7' }
      : { bg: '#0F172A', text: '#94A3B8', border: '1px solid #334155' };
  }
}
