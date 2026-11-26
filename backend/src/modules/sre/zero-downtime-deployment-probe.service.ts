import { DeploymentGateStatus } from '../../types/sre';

export class ZeroDowntimeDeploymentProbe {
  validateDeployment(liveSchemaVersion: string, requiredSchemaVersion: string, replicasSynced: boolean): DeploymentGateStatus {
    if (liveSchemaVersion !== requiredSchemaVersion) {
      return {
        schemaVersion: liveSchemaVersion,
        expectedVersion: requiredSchemaVersion,
        replicasSynced,
        canShiftTraffic: false,
        reason: `Database schema version ${liveSchemaVersion} does not match expected ${requiredSchemaVersion}`
      };
    }

    if (!replicasSynced) {
      return {
        schemaVersion: liveSchemaVersion,
        expectedVersion: requiredSchemaVersion,
        replicasSynced,
        canShiftTraffic: false,
        reason: 'Read replicas are still synchronizing migration changes'
      };
    }

    return {
      schemaVersion: liveSchemaVersion,
      expectedVersion: requiredSchemaVersion,
      replicasSynced: true,
      canShiftTraffic: true
    };
  }
}
