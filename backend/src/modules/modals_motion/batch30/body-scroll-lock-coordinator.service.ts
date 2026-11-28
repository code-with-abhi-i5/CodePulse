export class BodyScrollLockCoordinator {
  private activeLocks = new Set<string>();

  acquireLock(dialogId: string): boolean {
    this.activeLocks.add(dialogId);
    return true;
  }

  releaseLock(dialogId: string): boolean {
    this.activeLocks.delete(dialogId);
    return this.activeLocks.size === 0; // returns true when fully unlocked
  }

  isLocked(): boolean {
    return this.activeLocks.size > 0;
  }
}
