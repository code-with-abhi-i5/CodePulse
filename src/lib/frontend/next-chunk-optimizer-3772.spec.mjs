import assert from 'node:assert/strict';
import { NextRouteChunkOptimizerService_3772 } from './next-chunk-optimizer-3772.service.ts';
const svc = new NextRouteChunkOptimizerService_3772();
const c1 = svc.evaluateChunk('threejs-bundle', 240);
assert.equal(c1.splitRequired, true);
assert.equal(svc.planSplit(c1).length, 2);
console.log('Test passed for #3772');