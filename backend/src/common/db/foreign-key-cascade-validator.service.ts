import { CascadeValidationResult } from '../../types/db';

export class ForeignKeyCascadeValidatorService {
  validateCascade(parentEntity: string, parentId: string, dependentCounts: number[]): CascadeValidationResult {
    const total = dependentCounts.reduce((acc, c) => acc + c, 0);
    const isSafe = total <= 50;

    return {
      parentEntity,
      parentId,
      dependentRecordCount: total,
      isSafeToDelete: isSafe,
      warning: isSafe ? undefined : 'Cascade deletion would wipe ' + total + ' child records. Requires explicit confirmation.'
    };
  }
}
