import assert from 'node:assert/strict';
import { FlakyTestQuarantinerService } from './devops-infra-09.service.ts';

const detector = new FlakyTestQuarantinerService(0.2, 5);

for (let i = 0; i < 5; i++) {
  detector.recordRun('test_auth_token', true, false);
}
assert.strictEqual(detector.getQuarantinedTests().includes('test_auth_token'), false);

detector.recordRun('test_websocket_stream', true, false);
detector.recordRun('test_websocket_stream', false, true);
detector.recordRun('test_websocket_stream', true, false);
detector.recordRun('test_websocket_stream', false, true);
detector.recordRun('test_websocket_stream', true, false);

assert.strictEqual(detector.getQuarantinedTests().includes('test_websocket_stream'), true);

detector.unquarantine('test_websocket_stream');
assert.strictEqual(detector.getQuarantinedTests().includes('test_websocket_stream'), false);

console.log('Issue #3089 [DEVOPS-INFRA-09] spec passed successfully.');
