import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AccessibleFormErrorSummaryService } from './fe-ui-63.service.ts';

describe('AccessibleFormErrorSummaryService (FE-UI-63)', () => {
  it('identifies first erroneous field for automated focus transfer', () => {
    const summary = new AccessibleFormErrorSummaryService();
    summary.setErrors([
      { fieldId: 'email-input', fieldName: 'Email', message: 'Email is required' },
      { fieldId: 'password-input', fieldName: 'Password', message: 'Must be at least 8 chars' }
    ]);

    assert.strictEqual(summary.getFirstErrorFieldId(), 'email-input');

    summary.clearFieldError('email-input');
    assert.strictEqual(summary.getFirstErrorFieldId(), 'password-input');
  });

  it('generates WCAG compliant role=alert markup', () => {
    const summary = new AccessibleFormErrorSummaryService();
    summary.setErrors([
      { fieldId: 'username', fieldName: 'Username', message: 'Taken' }
    ]);
    const markup = summary.generateSummaryAriaMarkup();
    assert.ok(markup.includes('role="alert"'));
    assert.ok(markup.includes('<a href="#username">'));
  });
});
