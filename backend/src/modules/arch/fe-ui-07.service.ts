/**
 * Architecture Service: Accessible Keyboard Navigation State Machine
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-07]
 */

export class AccessibleKeyboardNavigationStateMachineService {
  private focusableIds: string[];
  private activeIndex: number;
  private isTrapped: boolean;

  constructor(focusableIds: string[] = [], isTrapped: boolean = false) {
    this.focusableIds = [...focusableIds];
    this.activeIndex = focusableIds.length > 0 ? 0 : -1;
    this.isTrapped = isTrapped;
  }

  public registerElements(ids: string[]): void {
    this.focusableIds = [...ids];
    if (this.activeIndex >= this.focusableIds.length) {
      this.activeIndex = this.focusableIds.length - 1;
    }
  }

  public handleKeyDown(key: 'ArrowDown' | 'ArrowUp' | 'Home' | 'End' | 'Tab', shiftKey: boolean = false): string | null {
    if (this.focusableIds.length === 0) return null;

    if (key === 'Home') {
      this.activeIndex = 0;
    } else if (key === 'End') {
      this.activeIndex = this.focusableIds.length - 1;
    } else if (key === 'ArrowDown' || (key === 'Tab' && !shiftKey)) {
      this.activeIndex = (this.activeIndex + 1) % this.focusableIds.length;
    } else if (key === 'ArrowUp' || (key === 'Tab' && shiftKey)) {
      this.activeIndex = (this.activeIndex - 1 + this.focusableIds.length) % this.focusableIds.length;
    }

    return this.focusableIds[this.activeIndex];
  }

  public getActiveElementId(): string | null {
    if (this.activeIndex < 0 || this.activeIndex >= this.focusableIds.length) return null;
    return this.focusableIds[this.activeIndex];
  }
}
