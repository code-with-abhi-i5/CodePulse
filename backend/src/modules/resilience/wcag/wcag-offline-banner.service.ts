export class WcagOfflineBannerA11y {
  public getBannerProps(): {
    role: string;
    ariaLive: string;
    ariaAtomic: boolean;
  } {
    return {
      role: 'status',
      ariaLive: 'polite',
      ariaAtomic: true
    };
  }
}
