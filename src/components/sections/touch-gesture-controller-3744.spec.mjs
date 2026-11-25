import assert from 'node:assert/strict';
import { MobileTouchGestureControllerService_3744 } from './touch-gesture-controller-3744.service.ts';
const svc = new MobileTouchGestureControllerService_3744();
assert.equal(svc.calculatePinchZoom(100, 150), 1.5);
assert.equal(svc.calculatePinchZoom(100, 500), 3.0); // clamped
console.log('Test passed for #3744');