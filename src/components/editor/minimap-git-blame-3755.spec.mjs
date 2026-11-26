import assert from 'node:assert/strict';
import { MonacoMinimapGitBlameService_3755 } from './minimap-git-blame-3755.service.ts';
const svc = new MonacoMinimapGitBlameService_3755();
assert.equal(svc.calculateHeat(0), 1.0);
assert.ok(svc.calculateHeat(48) < 1.0);
console.log('Test passed for #3755');