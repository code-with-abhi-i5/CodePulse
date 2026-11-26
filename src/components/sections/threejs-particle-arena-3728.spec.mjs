import assert from 'node:assert/strict';
import { ThreeJsParticleArenaService_3728 } from './threejs-particle-arena-3728.service.ts';
const svc = new ThreeJsParticleArenaService_3728(500);
const burst = svc.emitBurst(20);
assert.equal(burst.length, 20);
const remaining = svc.update(1.5);
assert.equal(remaining, 0);
console.log('Test passed for #3728');