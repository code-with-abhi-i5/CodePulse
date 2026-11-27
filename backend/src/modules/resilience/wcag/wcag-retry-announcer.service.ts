export class WcagQueryRetryStateAnnouncer {
  public formatRetryStatus(attempt: number, max: number): { ariaLive: string; text: string } {
    return {
      ariaLive: 'polite',
      text: `Network connection failed. Retrying request, attempt ${attempt} of ${max}.`
    };
  }
}
