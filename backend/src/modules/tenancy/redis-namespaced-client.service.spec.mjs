import test from 'node:test';
import assert from 'node:assert/strict';

class RedisNamespacedClient {
  constructor(tenantId) {
    if (!tenantId) throw new Error('Tenant ID required');
    this.tenantId = tenantId.replace(/[^a-zA-Z0-9_-]/g, '');
    this.inMemoryStore = new Map();
  }

  qualifyKey(rawKey) {
    return `tenant:${this.tenantId}:${rawKey}`;
  }

  async get(key) {
    return this.inMemoryStore.get(this.qualifyKey(key)) || null;
  }

  async set(key, value) {
    this.inMemoryStore.set(this.qualifyKey(key), value);
  }

  async del(key) {
    return this.inMemoryStore.delete(this.qualifyKey(key));
  }

  getQualifiedKey(key) {
    return this.qualifyKey(key);
  }
}

test('RedisNamespacedClient - enforces tenant namespace prefix on keys', async () => {
  const client1 = new RedisNamespacedClient('tenant1');
  const client2 = new RedisNamespacedClient('tenant2');

  await client1.set('session:123', 'data1');
  await client2.set('session:123', 'data2');

  assert.strictEqual(client1.getQualifiedKey('session:123'), 'tenant:tenant1:session:123');
  assert.strictEqual(client2.getQualifiedKey('session:123'), 'tenant:tenant2:session:123');
  assert.strictEqual(await client1.get('session:123'), 'data1');
  assert.strictEqual(await client2.get('session:123'), 'data2');
});
