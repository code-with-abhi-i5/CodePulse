import assert from 'node:assert/strict';
import { XtermTerminalEmulatorService_3801 } from './xterm-terminal-emulator-3801.service.ts';
const svc = new XtermTerminalEmulatorService_3801();
svc.write('\x1b[32mSuccess\x1b[0m\nDone');
assert.equal(svc.getLines()[0], 'Success');
assert.equal(svc.getLines()[1], 'Done');
console.log('Test passed for #3801');