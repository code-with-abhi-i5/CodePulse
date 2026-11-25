import assert from 'node:assert/strict';
import { TerraformIacModuleValidatorService } from './devops-infra-08.service.ts';

const validator = new TerraformIacModuleValidatorService();

const redisRes = validator.validateRedisCluster({
  clusterId: 'codepulse-redis-global',
  regions: ['us-east-1', 'eu-west-1'],
  nodeType: 'cache.r6g.large',
  numShards: 3,
  replicasPerShard: 2,
  transitEncryptionEnabled: true,
  atRestEncryptionEnabled: true
});
assert.strictEqual(redisRes.isValid, true);

const s3Res = validator.validateS3Bucket({
  bucketName: 'codepulse-static-assets-prod',
  versioningEnabled: true,
  serverSideEncryption: 'AES256',
  blockPublicAcls: true,
  blockPublicPolicy: true
});
assert.strictEqual(s3Res.isValid, true);

console.log('Issue #3088 [DEVOPS-INFRA-08] spec passed successfully.');
