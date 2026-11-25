import assert from 'node:assert/strict';
import { NextRouteChunkOptimizerService_3732 } from './next-chunk-optimizer-3732.service.ts';
const svc = new NextRouteChunkOptimizerService_3732();
const c1 = svc.evaluateChunk('threejs-bundle', 240);
assert.equal(c1.splitRequired, true);
assert.equal(svc.planSplit(c1).length, 2);
console.log('Test passed for #3732');