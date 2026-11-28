export class RepoDeletionConfirmValidator {
  validateConfirmation(expectedName: string, typedInput: string): { isValid: boolean; error?: string } {
    if (!expectedName) {
      return { isValid: false, error: 'Target repository name is missing' };
    }
    const trimmedTyped = (typedInput || '').trim();
    if (!trimmedTyped) {
      return { isValid: false, error: 'Please enter repository name to confirm deletion' };
    }
    if (trimmedTyped !== expectedName.trim()) {
      return { isValid: false, error: 'Typed repository name does not match' };
    }
    return { isValid: true };
  }
}
