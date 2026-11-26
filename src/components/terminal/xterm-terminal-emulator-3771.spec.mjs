import assert from 'node:assert/strict';
import { XtermTerminalEmulatorService_3771 } from './xterm-terminal-emulator-3771.service.ts';
const svc = new XtermTerminalEmulatorService_3771();
svc.write('\x1b[32mSuccess\x1b[0m\nDone');
assert.equal(svc.getLines()[0], 'Success');
assert.equal(svc.getLines()[1], 'Done');
console.log('Test passed for #3771');