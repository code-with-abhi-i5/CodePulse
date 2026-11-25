/**
 * Architecture Service: Terraform Infrastructure-as-Code Module Validator
 * Subsystem: Advanced DevOps & Infrastructure Automation [DEVOPS-INFRA-08]
 */

export interface RedisClusterConfig {
  clusterId: string;
  regions: string[];
  nodeType: string;
  numShards: number;
  replicasPerShard: number;
  transitEncryptionEnabled: boolean;
  atRestEncryptionEnabled: boolean;
}

export interface S3BucketConfig {
  bucketName: string;
  versioningEnabled: boolean;
  serverSideEncryption: 'AES256' | 'aws:kms';
  blockPublicAcls: boolean;
  blockPublicPolicy: boolean;
}

export class TerraformIacModuleValidatorService {
  public validateRedisCluster(config: RedisClusterConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!config.clusterId) errors.push('Missing clusterId');
    if (!config.regions || config.regions.length < 2) errors.push('Multi-region requires at least 2 regions');
    if (!config.transitEncryptionEnabled) errors.push('Transit encryption must be enabled');
    if (!config.atRestEncryptionEnabled) errors.push('At-rest encryption must be enabled');
    if (config.numShards < 1) errors.push('Number of shards must be at least 1');

    return { isValid: errors.length === 0, errors };
  }

  public validateS3Bucket(config: S3BucketConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!config.bucketName) errors.push('Missing bucketName');
    if (!config.versioningEnabled) errors.push('S3 versioning must be enabled');
    if (!config.blockPublicAcls || !config.blockPublicPolicy) errors.push('Public access must be fully blocked');

    return { isValid: errors.length === 0, errors };
  }
}
