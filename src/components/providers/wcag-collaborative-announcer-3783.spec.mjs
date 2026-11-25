import assert from 'node:assert/strict';
import { WcagCollaborativeAnnouncerService_3783 } from './wcag-collaborative-announcer-3783.service.ts';
const svc = new WcagCollaborativeAnnouncerService_3783();
const ann = svc.announceCursor('Alice', 42, 10);
assert.ok(ann.message.includes('line 42, column 10'));
assert.equal(svc.getLatest()?.user, 'Alice');
console.log('Test passed for #3783');