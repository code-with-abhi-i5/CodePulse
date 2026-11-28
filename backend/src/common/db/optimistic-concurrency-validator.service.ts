import { ConcurrencyCheckResult } from '../../types/db';

export class OptimisticConcurrencyValidatorService {
  public validateVersion(currentVersion: number, expectedVersion: number): ConcurrencyCheckResult {
    const conflictDetected = currentVersion !== expectedVersion;
    const canUpdate = !conflictDetected;

    return {
      canUpdate,
      currentVersion,
      expectedVersion,
      conflictDetected,
      sqlPredicate: `version = ${expectedVersion}`
    };
  }

  public buildConditionalUpdateSql(
    tableName: string,
    id: string | number,
    expectedVersion: number,
    updates: Record<string, unknown>
  ): { sql: string; values: unknown[]; nextVersion: number } {
    const nextVersion = expectedVersion + 1;
    const setClauses: string[] = ['"version" = $' + 1];
    const values: unknown[] = [nextVersion];

    let paramIdx = 2;
    for (const [key, val] of Object.entries(updates)) {
      if (key !== 'version' && key !== 'id') {
        setClauses.push(`"${key}" = $${paramIdx}`);
        values.push(val);
        paramIdx++;
      }
    }

    const idParam = paramIdx++;
    const versionParam = paramIdx;
    values.push(id, expectedVersion);

    const sql = `UPDATE "${tableName}" SET ${setClauses.join(', ')} WHERE "id" = $${idParam} AND "version" = $${versionParam};`;

    return { sql, values, nextVersion };
  }
}
