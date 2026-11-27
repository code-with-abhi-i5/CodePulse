import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { LWWElementSetCRDT } from './lww-element-set-crdt.service.ts';

describe('LWWElementSetCRDT [ARCH-CORE-036]', () => {
  test('adds element and confirms membership', () => {
    const crdt = new LWWElementSetCRDT();
    crdt.add('alice', 100);
    assert.ok(crdt.lookup('alice'));
    assert.deepEqual(crdt.elements(), ['alice']);
  });

  test('removes element with higher timestamp', () => {
    const crdt = new LWWElementSetCRDT();
    crdt.add('bob', 100);
    crdt.remove('bob', 200);
    assert.equal(crdt.lookup('bob'), false);
    assert.equal(crdt.elements().length, 0);
  });

  test('re-adding with even newer timestamp revives element', () => {
    const crdt = new LWWElementSetCRDT();
    crdt.add('charlie', 100);
    crdt.remove('charlie', 200);
    crdt.add('charlie', 300);
    assert.ok(crdt.lookup('charlie'));
  });

  test('concurrent merges converge consistently on both replicas', () => {
    const replica1 = new LWWElementSetCRDT();
    const replica2 = new LWWElementSetCRDT();

    replica1.add('item1', 100);
    replica1.add('item2', 200);

    replica2.add('item3', 150);
    replica2.remove('item2', 250);

    replica1.merge(replica2);
    replica2.merge(replica1);

    assert.deepEqual(replica1.elements().sort(), replica2.elements().sort());
    assert.equal(replica1.lookup('item2'), false);
    assert.ok(replica1.lookup('item1'));
    assert.ok(replica1.lookup('item3'));
  });
});
