import assert from 'node:assert/strict';
import { MonacoMinimapGitBlameService_3795 } from './minimap-git-blame-3795.service.ts';
const svc = new MonacoMinimapGitBlameService_3795();
assert.equal(svc.calculateHeat(0), 1.0);
assert.ok(svc.calculateHeat(48) < 1.0);
console.log('Test passed for #3795');