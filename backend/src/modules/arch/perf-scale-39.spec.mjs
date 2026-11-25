import assert from 'node:assert/strict';
import { TcpNoDelayConfiguratorService } from './perf-scale-39.service.ts';

const configurator = new TcpNoDelayConfiguratorService();

let noDelayState = false;
let keepAliveState = false;
let timeoutState = 0;

const mockSocket = {
  setNoDelay(val) { noDelayState = val; return this; },
  setKeepAlive(val, delay) { keepAliveState = val; return this; },
  setTimeout(val) { timeoutState = val; return this; }
};

const success = configurator.configureSocket(mockSocket);
assert.strictEqual(success, true);
assert.strictEqual(noDelayState, true);
assert.strictEqual(keepAliveState, true);
assert.strictEqual(timeoutState, 30000);
assert.strictEqual(configurator.getConfiguredCount(), 1);

console.log('Issue #3074 [PERF-SCALE-39] spec passed successfully.');
