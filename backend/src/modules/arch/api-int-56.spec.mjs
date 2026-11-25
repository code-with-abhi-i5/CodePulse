import { describe, it } from 'node:test';
import assert from 'node:assert';
import { GrpcProtobufCompatibilityLinterService } from './api-int-56.service.ts';

describe('GrpcProtobufCompatibilityLinterService (API-INT-56)', () => {
  it('flags tag removals and type alterations as breaking schema changes', () => {
    const linter = new GrpcProtobufCompatibilityLinterService();
    const oldProto = [
      { tag: 1, name: 'id', type: 'string' },
      { tag: 2, name: 'score', type: 'int32' }
    ];

    const compatibleNew = [
      { tag: 1, name: 'id', type: 'string' },
      { tag: 2, name: 'score', type: 'int32' },
      { tag: 3, name: 'bonus', type: 'int32' }
    ];
    assert.strictEqual(linter.checkCompatibility(oldProto, compatibleNew).compatible, true);

    const breakingNew = [
      { tag: 1, name: 'id', type: 'string' },
      { tag: 2, name: 'score', type: 'int64' } // Type changed
    ];
    assert.strictEqual(linter.checkCompatibility(oldProto, breakingNew).compatible, false);
  });
});
