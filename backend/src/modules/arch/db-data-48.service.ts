/**
 * Architecture Service: Optimistic Locking Version Validator
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-48]
 */

export class OptimisticLockingVersionValidatorService {
  public validateAndPrepareUpdate(
    tableName: string,
    recordId: string,
    currentVersion: number,
    updateFields: Record<string, unknown>
  ): {
    sql: string;
    nextVersion: number;
    expectedVersion: number;
  } {
    if (typeof currentVersion !== 'number' || currentVersion < 0) {
      throw new Error('Invalid version field provided for optimistic locking');
    }

    const nextVersion = currentVersion + 1;
    const assignments = Object.keys(updateFields)
      .map((k) => `${k} = :update_${k}`)
      .concat([`version = ${nextVersion}`]);

    const sql = `UPDATE ${tableName} SET ${assignments.join(', ')} WHERE id = :id AND version = ${currentVersion};`;

    return { sql, nextVersion, expectedVersion: currentVersion };
  }
}
