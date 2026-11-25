import assert from 'node:assert/strict';
import { MultiFileTabbedMonacoService_3790 } from './multifile-tabbed-monaco-3790.service.ts';
const svc = new MultiFileTabbedMonacoService_3790();
svc.openTab('index.ts');
svc.openTab('app.tsx');
assert.equal(svc.getActive()?.path, 'app.tsx');
svc.closeTab('app.tsx');
assert.equal(svc.getActive(), undefined);
console.log('Test passed for #3790');