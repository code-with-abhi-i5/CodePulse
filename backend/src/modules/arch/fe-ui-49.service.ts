/**
 * Architecture Service: Monaco Code Tour Guided Walkthrough
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-49]
 */

export interface TourStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  filePath: string;
  startLine: number;
  endLine: number;
}

export class MonacoCodeTourService {
  private steps: TourStep[];
  private activeStepIndex: number;

  constructor(steps: TourStep[] = []) {
    this.steps = steps;
    this.activeStepIndex = 0;
  }

  public setSteps(steps: TourStep[]): void {
    this.steps = steps;
    this.activeStepIndex = 0;
  }

  public getCurrentStep(): TourStep | null {
    if (this.steps.length === 0 || this.activeStepIndex >= this.steps.length) {
      return null;
    }
    return this.steps[this.activeStepIndex];
  }

  public nextStep(): TourStep | null {
    if (this.activeStepIndex < this.steps.length - 1) {
      this.activeStepIndex++;
      return this.steps[this.activeStepIndex];
    }
    return null;
  }

  public previousStep(): TourStep | null {
    if (this.activeStepIndex > 0) {
      this.activeStepIndex--;
      return this.steps[this.activeStepIndex];
    }
    return null;
  }

  public jumpToStep(index: number): boolean {
    if (index >= 0 && index < this.steps.length) {
      this.activeStepIndex = index;
      return true;
    }
    return false;
  }

  public getProgress(): { current: number; total: number; percentage: number } {
    const total = this.steps.length;
    const current = total === 0 ? 0 : this.activeStepIndex + 1;
    const percentage = total === 0 ? 0 : Math.round((current / total) * 100);
    return { current, total, percentage };
  }
}
