/**
 * Architecture Service: GraphQL Input Object Validation Pipe
 * Subsystem: Input Validation & Type Safety
 */

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  min?: number;
}

export class GraphqlInputValidatorPipeService {
  public validateInput(
    data: Record<string, unknown>,
    rules: Record<string, ValidationRule>
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const [field, rule] of Object.entries(rules)) {
      const val = data[field];
      if (rule.required && (val === undefined || val === null || val === '')) {
        errors.push(`Field ${field} is required`);
        continue;
      }
      if (val !== undefined && val !== null) {
        if (rule.minLength !== undefined && typeof val === 'string' && val.length < rule.minLength) {
          errors.push(`Field ${field} must have length >= ${rule.minLength}`);
        }
        if (rule.min !== undefined && typeof val === 'number' && val < rule.min) {
          errors.push(`Field ${field} must be >= ${rule.min}`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }
}
