export class EscapeKeyListenerRegistry {
  private stack: Array<{ id: string; onEscape: () => void }> = [];

  register(id: string, onEscape: () => void): void {
    this.stack = this.stack.filter(item => item.id !== id);
    this.stack.push({ id, onEscape });
  }

  unregister(id: string): void {
    this.stack = this.stack.filter(item => item.id !== id);
  }

  handleEscapeKey(): boolean {
    if (this.stack.length === 0) return false;
    const topmost = this.stack.pop();
    if (topmost && typeof topmost.onEscape === 'function') {
      topmost.onEscape();
      return true;
    }
    return false;
  }

  getActiveCount(): number {
    return this.stack.length;
  }
}
