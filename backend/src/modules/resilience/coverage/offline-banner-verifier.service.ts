export class OfflineBannerStateVerifier {
  private isOnline = true;
  private dismissed = false;

  public setStatus(online: boolean): void {
    this.isOnline = online;
    if (online) this.dismissed = false; // Reset dismiss on reconnect
  }

  public dismiss(): void {
    this.dismissed = true;
  }

  public shouldRenderBanner(): boolean {
    return !this.isOnline && !this.dismissed;
  }
}
