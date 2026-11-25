import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ClickHouseDictionaryPreloaderService } from './db-data-42.service.ts';

describe('ClickHouseDictionaryPreloaderService (DB-DATA-42)', () => {
  it('generates ClickHouse hashed external dictionary DDL and reload query', () => {
    const preloader = new ClickHouseDictionaryPreloaderService();
    const ddl = preloader.generateDictionaryDdl('dict_user_tiers', 'users', 'id', 1800);

    assert.ok(ddl.includes('LAYOUT(HASHED())'));
    assert.ok(ddl.includes("SOURCE(POSTGRESQL(TABLE 'users'))"));

    const reload = preloader.generatePreloadQuery('dict_user_tiers');
    assert.strictEqual(reload, 'SYSTEM RELOAD DICTIONARY dict_user_tiers;');
  });
});
