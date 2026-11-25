import assert from 'node:assert/strict';
import { MobileTouchGestureControllerService_3724 } from './touch-gesture-controller-3724.service.ts';
const svc = new MobileTouchGestureControllerService_3724();
assert.equal(svc.calculatePinchZoom(100, 150), 1.5);
assert.equal(svc.calculatePinchZoom(100, 500), 3.0); // clamped
console.log('Test passed for #3724');