export class WcagRadarMatchmakingAnnouncer {
  getQueueAnnouncement(elapsedSeconds: number, matchedPlayerName?: string) {
    if (matchedPlayerName) {
      return {
        role: 'alert',
        ariaLive: 'assertive',
        text: `Opponent found: ${matchedPlayerName}. Match starting.`
      };
    }
    return {
      role: 'status',
      ariaLive: 'polite',
      text: `Searching for opponent... ${elapsedSeconds} seconds in queue.`
    };
  }
}
