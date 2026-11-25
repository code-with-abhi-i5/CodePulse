import assert from 'node:assert/strict';
import { MonacoMinimapGitBlameService_3785 } from './minimap-git-blame-3785.service.ts';
const svc = new MonacoMinimapGitBlameService_3785();
assert.equal(svc.calculateHeat(0), 1.0);
assert.ok(svc.calculateHeat(48) < 1.0);
console.log('Test passed for #3785');