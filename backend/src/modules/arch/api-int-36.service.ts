/**
 * Architecture Service: GraphQL Mutation Transaction Boundary Manager
 * Subsystem: Mutation Consistency & Transaction Isolation
 */

export class GraphqlMutationTransactionManagerService {
  public async executeInTransaction<T>(
    operations: (() => Promise<unknown>)[],
    commitFn: () => Promise<void>,
    rollbackFn: () => Promise<void>
  ): Promise<boolean> {
    try {
      for (const op of operations) {
        await op();
      }
      await commitFn();
      return true;
    } catch {
      await rollbackFn();
      return false;
    }
  }
}
