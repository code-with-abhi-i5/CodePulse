import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
const sql = name => readFileSync(new URL(`../prisma/migrations/${name}/migration.sql`, import.meta.url), 'utf8');
test('PR snapshots enforce repository identity, retain long delays and cascade on repository deletion', async () => {
  const db = new PGlite();
  try {
    await db.exec(sql('00000000000000_baseline'));
    await db.exec(`INSERT INTO users (id,"githubId",username,"updatedAt") VALUES ('u','g','demo',now());
      INSERT INTO repositories (id,"githubRepoId","userId",name,"fullName",url,"repoCreatedAt","repoUpdatedAt","updatedAt")
      VALUES ('r','g','u','repo','owner/repo','https://github.com/owner/repo',now(),now(),now());`);
    await db.exec(sql('20261117070000_pr_velocity'));
    await db.exec(`INSERT INTO pull_request_metrics (id,"repositoryId","prNumber","authorLogin","createdAt","timeToFirstReviewMs","refreshedAt")
      VALUES ('m','r',1,'author',now(),2678400000,now());`);
    assert.equal((await db.query('SELECT "timeToFirstReviewMs" FROM pull_request_metrics')).rows[0].timeToFirstReviewMs, 2678400000);
    await assert.rejects(db.exec(`INSERT INTO pull_request_metrics (id,"repositoryId","prNumber","authorLogin","createdAt","refreshedAt") VALUES ('duplicate','r',1,'author',now(),now());`), /unique/);
    await assert.rejects(db.exec(`INSERT INTO pull_request_metrics (id,"repositoryId","prNumber","authorLogin","createdAt","refreshedAt") VALUES ('orphan','missing',2,'author',now(),now());`), /foreign key/);
    await db.exec("DELETE FROM repositories WHERE id = 'r'");
    assert.equal((await db.query('SELECT count(*) AS count FROM pull_request_metrics')).rows[0].count, 0);
  } finally { await db.close(); }
});
