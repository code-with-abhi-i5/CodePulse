import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ApiPortalSdkGeneratorService } from './api-int-65.service.ts';

describe('ApiPortalSdkGeneratorService (API-INT-65)', () => {
  it('generates complete TypeScript SDK source code for API schemas', () => {
    const generator = new ApiPortalSdkGeneratorService();
    const sdkSource = generator.generateTypeScriptSdk('CodePulse', [
      { name: 'getChallenges', method: 'GET', path: '/api/v1/challenges', responseType: 'Challenge[]' },
      { name: 'createSubmission', method: 'POST', path: '/api/v1/submissions', requestType: 'SubmissionInput', responseType: 'SubmissionResult' }
    ]);

    assert.ok(sdkSource.includes('export class CodePulseClient'));
    assert.ok(sdkSource.includes('public async getChallenges()'));
    assert.ok(sdkSource.includes('public async createSubmission(payload: SubmissionInput)'));
  });
});
