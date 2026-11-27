import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { BinaryAstSerializer } from './binary-ast-serializer.service.ts';

describe('BinaryAstSerializer [ARCH-CORE-009]', () => {
  const serializer = new BinaryAstSerializer();

  test('serializes AST tree into compact binary and deserializes with 100% fidelity', () => {
    const tree = {
      type: 1, // PROGRAM
      id: 100,
      name: 'MainProgram',
      children: [
        { type: 2, id: 101, name: 'FunctionDecl', children: [] },
        { type: 3, id: 102, name: 'ReturnStmt', children: [] }
      ]
    };

    const binary = serializer.serialize(tree);
    assert.ok(binary.length > 0);

    const res = serializer.deserialize(binary);
    assert.deepEqual(res.node, tree);
    assert.equal(res.bytesRead, binary.length);
  });
});
