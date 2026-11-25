/**
 * Architecture Service: Accessible Form Error Summary
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-63]
 */

export interface FormError {
  fieldId: string;
  fieldName: string;
  message: string;
}

export class AccessibleFormErrorSummaryService {
  private errors: FormError[];

  constructor() {
    this.errors = [];
  }

  public setErrors(errors: FormError[]): void {
    this.errors = errors;
  }

  public getErrors(): FormError[] {
    return [...this.errors];
  }

  public getFirstErrorFieldId(): string | null {
    return this.errors.length > 0 ? this.errors[0].fieldId : null;
  }

  public clearFieldError(fieldId: string): void {
    this.errors = this.errors.filter(e => e.fieldId !== fieldId);
  }

  public generateSummaryAriaMarkup(): string {
    if (this.errors.length === 0) return '';
    const items = this.errors
      .map(e => `<li><a href="#${e.fieldId}">${e.fieldName}: ${e.message}</a></li>`)
      .join('');
    return `<div role="alert" aria-labelledby="error-summary-heading"><h2 id="error-summary-heading">There is a problem</h2><ul>${items}</ul></div>`;
  }
}
