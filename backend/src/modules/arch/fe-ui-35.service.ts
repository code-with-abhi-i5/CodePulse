/**
 * Architecture Service: Debounced Form Validation Engine
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-35]
 */

export class DebouncedFormValidationEngineService {
  private existingUsernames: Set<string>;

  constructor(existingUsernames: string[] = ['alice', 'bob', 'admin']) {
    this.existingUsernames = new Set(existingUsernames);
  }

  public validateSync(value: string): { valid: boolean; error?: string } {
    if (!value || value.trim().length === 0) {
      return { valid: false, error: 'Username cannot be empty' };
    }
    if (value.length < 3) {
      return { valid: false, error: 'Username must be at least 3 characters' };
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      return { valid: false, error: 'Username can only contain alphanumeric characters, hyphens, and underscores' };
    }
    return { valid: true };
  }

  public async validateAsyncUniqueness(value: string): Promise<{ available: boolean; error?: string }> {
    const syncRes = this.validateSync(value);
    if (!syncRes.valid) {
      return { available: false, error: syncRes.error };
    }

    // Mock debounced API lookup
    const normalized = value.toLowerCase().trim();
    if (this.existingUsernames.has(normalized)) {
      return { available: false, error: `Username '${value}' is already taken` };
    }

    return { available: true };
  }
}
