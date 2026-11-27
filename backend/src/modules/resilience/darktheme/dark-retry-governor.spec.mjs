import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { DarkThemeRetryGovernor } from './dark-retry-governor.service.ts';

describe('DarkThemeRetryGovernor [L2-ERROR-RETRY-OFFLINE-023]', () => {
  const gov = new DarkThemeRetryGovernor();

  test('returns amber retry indicator for active retry in dark theme', () => {
    assert.equal(gov.getRetryIndicatorStyle(true).color, '#FBBF24');
    assert.equal(gov.getRetryIndicatorStyle(false).color, '#34D399');
  });
});
