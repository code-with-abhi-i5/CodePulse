export class ModalScrollLockManager {
  private activeLocks = 0;

  lock(): { locked: boolean; overflow: string; paddingRight: string } {
    this.activeLocks++;
    return {
      locked: true,
      overflow: 'hidden',
      paddingRight: '15px' // compensate for scrollbar width to prevent layout shift
    };
  }

  unlock(): { locked: boolean; overflow: string; paddingRight: string } {
    this.activeLocks = Math.max(0, this.activeLocks - 1);
    const hasRemaining = this.activeLocks > 0;
    return {
      locked: hasRemaining,
      overflow: hasRemaining ? 'hidden' : 'unset',
      paddingRight: hasRemaining ? '15px' : '0px'
    };
  }

  getLockCount(): number {
    return this.activeLocks;
  }
}
