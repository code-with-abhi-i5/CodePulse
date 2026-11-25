import { Injectable } from '@nestjs/common';
import { MvccUpdateResult } from '../../types/database';

@Injectable()
export class MvccCoordinatorService {
  private readonly entityVersions: Map<string, number> = new Map();

  getVersion(entityId: string): number {
    return this.entityVersions.get(entityId) || 1;
  }

  verifyAndUpdate(entityId: string, expectedVersion: number, payload: any): MvccUpdateResult {
    const current = this.getVersion(entityId);
    if (expectedVersion !== current) {
      return { success: false, newVersion: current };
    }
    const next = current + 1;
    this.entityVersions.set(entityId, next);
    return { success: true, newVersion: next };
  }
}
