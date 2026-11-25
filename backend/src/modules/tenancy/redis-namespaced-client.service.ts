export class RedisNamespacedClient {
  private tenantId: string;
  private inMemoryStore: Map<string, string> = new Map();

  constructor(tenantId: string) {
    if (!tenantId) throw new Error('Tenant ID required');
    this.tenantId = tenantId.replace(/[^a-zA-Z0-9_-]/g, '');
  }

  private qualifyKey(rawKey: string): string {
    return `tenant:${this.tenantId}:${rawKey}`;
  }

  async get(key: string): Promise<string | null> {
    return this.inMemoryStore.get(this.qualifyKey(key)) || null;
  }

  async set(key: string, value: string): Promise<void> {
    this.inMemoryStore.set(this.qualifyKey(key), value);
  }

  async del(key: string): Promise<boolean> {
    return this.inMemoryStore.delete(this.qualifyKey(key));
  }

  getQualifiedKey(key: string): string {
    return this.qualifyKey(key);
  }
}
