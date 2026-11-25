import assert from 'node:assert/strict';
import { IndexedDbOfflineQueueService_3739 } from './indexeddb-offline-queue-3739.service.ts';
const svc = new IndexedDbOfflineQueueService_3739();
const tx = svc.enqueue({ code: 'const x = 1;' });
assert.equal(tx.status, 'queued');
assert.equal(svc.getPending().length, 1);
assert.equal(svc.rollback(tx.id), true);
assert.equal(svc.getPending().length, 0);
console.log('Test passed for #3739');