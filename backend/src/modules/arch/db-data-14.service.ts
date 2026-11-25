/**
 * Architecture Service: Optimistic Concurrency Control (OCC) Versioning Mitigator
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-14]
 */

export interface VersionedEntity {
  id: string;
  version: number;
  data: Record<string, unknown>;
}

export class OptimisticConcurrencyVersionService {
  public async executeMutationWithOcc<T extends VersionedEntity>(
    entity: T,
    mutator: (current: T) => Partial<T['data']>,
    persistFn: (id: string, expectedVersion: number, newVersion: number, updatedData: Record<string, unknown>) => Promise<boolean>,
    maxRetries: number = 3
  ): Promise<{ success: boolean; finalVersion: number; retries: number }> {
    let current = { ...entity };
    let retries = 0;

    while (retries <= maxRetries) {
      const updatedData = { ...current.data, ...mutator(current) };
      const nextVersion = current.version + 1;

      const persisted = await persistFn(current.id, current.version, nextVersion, updatedData);
      if (persisted) {
        return { success: true, finalVersion: nextVersion, retries };
      }

      retries++;
      current.version++; // simulate reading updated version from db
    }

    return { success: false, finalVersion: current.version, retries };
  }
}
