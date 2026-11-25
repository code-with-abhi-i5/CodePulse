import assert from 'node:assert/strict';
import { WasmTreeSitterParserService_3777 } from './wasm-treesitter-parser-3777.service.ts';
const svc = new WasmTreeSitterParserService_3777();
const ast = svc.parse('import { x } from "y";\nconst z = 1;');
assert.equal(ast.length, 2);
assert.equal(ast[0].type, 'import');
const diff = svc.diff('a', 'a\nb');
assert.equal(diff[0].changeType, 'inserted');
console.log('Test passed for #3777');