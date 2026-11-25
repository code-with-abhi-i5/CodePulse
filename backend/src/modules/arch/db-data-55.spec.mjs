import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DatabasePoolSslAutoReloadService } from './db-data-55.service.ts';

describe('DatabasePoolSslAutoReloadService (DB-DATA-55)', () => {
  it('detects certificate changes on disk and triggers hot SSL reload without restarting process', () => {
    const service = new DatabasePoolSslAutoReloadService();

    const certV1 = '-----BEGIN CERTIFICATE-----\nMIIB...V1\n-----END CERTIFICATE-----';
    const init = service.checkForReload(certV1);
    assert.strictEqual(init.reloaded, false);

    // Same cert
    const same = service.checkForReload(certV1);
    assert.strictEqual(same.reloaded, false);

    // Renewed cert V2
    const certV2 = '-----BEGIN CERTIFICATE-----\nMIIB...V2_RENEWED\n-----END CERTIFICATE-----';
    const renew = service.checkForReload(certV2);
    assert.strictEqual(renew.reloaded, true);
  });
});
