import assert from 'node:assert/strict';
import test from 'node:test';
import crypto from 'node:crypto';

class CacheBinaryService {
  constructor() {
    this.cache = new Map();
  }

  computeSourceHash(code, compilerFlags = []) {
    const payload = `${code.trim()}::${compilerFlags.sort().join(' ')}`;
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  getCachedBinary(hash) {
    const item = this.cache.get(hash);
    if (!item) return null;
    item.hits++;
    item.lastAccessedAt = Date.now();
    return item.data;
  }

  storeCompiledBinary(hash, binary) {
    this.cache.set(hash, { data: binary, binarySize: binary.length, hits: 0, lastAccessedAt: Date.now() });
    return true;
  }

  evictLruBinaries(targetBytesToFree) {
    let freed = 0;
    const sorted = Array.from(this.cache.entries()).sort((a, b) => a[1].lastAccessedAt - b[1].lastAccessedAt);
    for (const [hash, item] of sorted) {
      if (freed >= targetBytesToFree) break;
      freed += item.binarySize;
      this.cache.delete(hash);
    }
    return freed;
  }

  getCacheStats() {
    return {
      entriesCount: this.cache.size,
      totalBytes: Array.from(this.cache.values()).reduce((s, it) => s + it.binarySize, 0)
    };
  }
}

test('CacheBinaryService: caches compiled binaries by SHA256 and supports LRU eviction', () => {
  const cache = new CacheBinaryService();
  const hash1 = cache.computeSourceHash('int main() { return 0; }', ['-O3']);
  const fakeBin = Buffer.from('ELF_BINARY_CONTENT');

  cache.storeCompiledBinary(hash1, fakeBin);
  assert.equal(cache.getCacheStats().entriesCount, 1);

  const retrieved = cache.getCachedBinary(hash1);
  assert.deepEqual(retrieved, fakeBin);

  const freed = cache.evictLruBinaries(5);
  assert.ok(freed >= 5);
  assert.equal(cache.getCacheStats().entriesCount, 0);
});
