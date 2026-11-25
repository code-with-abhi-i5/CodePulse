/**
 * Architecture Service: Modal Focus Management Coordinator
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-21]
 */

export class ModalFocusManagementCoordinatorService {
  private previouslyFocusedElementId: string | null;
  private modalFocusableIds: string[];
  private currentFocusIndex: number;

  constructor() {
    this.previouslyFocusedElementId = null;
    this.modalFocusableIds = [];
    this.currentFocusIndex = -1;
  }

  public openModal(triggerElementId: string, focusableIds: string[]): string | null {
    this.previouslyFocusedElementId = triggerElementId;
    this.modalFocusableIds = [...focusableIds];
    this.currentFocusIndex = focusableIds.length > 0 ? 0 : -1;
    return this.getFocusedElementId();
  }

  public closeModal(): string | null {
    const returnTarget = this.previouslyFocusedElementId;
    this.previouslyFocusedElementId = null;
    this.modalFocusableIds = [];
    this.currentFocusIndex = -1;
    return returnTarget;
  }

  public cycleTab(shiftKey: boolean = false): string | null {
    if (this.modalFocusableIds.length === 0) return null;
    if (shiftKey) {
      this.currentFocusIndex = (this.currentFocusIndex - 1 + this.modalFocusableIds.length) % this.modalFocusableIds.length;
    } else {
      this.currentFocusIndex = (this.currentFocusIndex + 1) % this.modalFocusableIds.length;
    }
    return this.getFocusedElementId();
  }

  public getFocusedElementId(): string | null {
    if (this.currentFocusIndex < 0 || this.currentFocusIndex >= this.modalFocusableIds.length) return null;
    return this.modalFocusableIds[this.currentFocusIndex];
  }
}
