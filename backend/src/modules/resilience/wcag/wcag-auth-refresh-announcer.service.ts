export class WcagAuthRefreshAnnouncer {
  public getStatusLiveRegion(isRefreshing: boolean): { ariaLive: string; text: string } {
    if (isRefreshing) {
      return { ariaLive: 'polite', text: 'Refreshing authenticated session...' };
    }
    return { ariaLive: 'polite', text: 'Session successfully refreshed.' };
  }
}
