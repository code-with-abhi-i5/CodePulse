export class FloatingOfflineBannerManager {
  private isOnline = true;
  private pendingSyncCount = 0;

  setOnlineStatus(online: boolean): void {
    this.isOnline = online;
  }

  incrementPendingSync(): number {
    return ++this.pendingSyncCount;
  }

  clearPendingSync(): void {
    this.pendingSyncCount = 0;
  }

  getBannerState() {
    return {
      visible: !this.isOnline,
      message: this.isOnline
        ? 'Connection restored'
        : `You are offline. ${this.pendingSyncCount} changes queued.`,
      severity: this.isOnline ? 'success' : 'warning',
      queuedOperations: this.pendingSyncCount
    };
  }
}
