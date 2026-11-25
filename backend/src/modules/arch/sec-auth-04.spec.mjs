import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Argon2idHardwareGovernorService } from './sec-auth-04.service.ts';

describe('Argon2idHardwareGovernorService (SEC-AUTH-04)', () => {
  it('dynamically calculates optimal Argon2id parameters based on hardware resources', () => {
    const governor = new Argon2idHardwareGovernorService();

    const highEnd = governor.calculateOptimalParameters(32768, 16);
    assert.strictEqual(highEnd.memoryCostKiB, 65536);
    assert.strictEqual(highEnd.parallelism, 8); // capped at 8

    const modest = governor.calculateOptimalParameters(2048, 2);
    assert.strictEqual(modest.memoryCostKiB, 19456);
    assert.strictEqual(modest.parallelism, 2);
  });
});
