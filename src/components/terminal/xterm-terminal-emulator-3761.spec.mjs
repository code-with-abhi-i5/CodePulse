import assert from 'node:assert/strict';
import { XtermTerminalEmulatorService_3761 } from './xterm-terminal-emulator-3761.service.ts';
const svc = new XtermTerminalEmulatorService_3761();
svc.write('\x1b[32mSuccess\x1b[0m\nDone');
assert.equal(svc.getLines()[0], 'Success');
assert.equal(svc.getLines()[1], 'Done');
console.log('Test passed for #3761');