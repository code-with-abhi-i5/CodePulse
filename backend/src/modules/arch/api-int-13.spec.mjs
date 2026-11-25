import { describe, it } from 'node:test';
import assert from 'node:assert';
import { GrpcReflectionDocumentationService } from './api-int-13.service.ts';

describe('GrpcReflectionDocumentationService (API-INT-13)', () => {
  it('registers grpc services and generates reflection descriptors and documentation', () => {
    const reflection = new GrpcReflectionDocumentationService();
    reflection.registerService({
      name: 'codepulse.ChallengeService',
      methods: [
        { name: 'GetChallenge', requestType: 'GetChallengeRequest', responseType: 'ChallengeResponse', isStreaming: false },
        { name: 'StreamResults', requestType: 'StreamRequest', responseType: 'StreamEvent', isStreaming: true }
      ]
    });

    assert.deepStrictEqual(reflection.listServices(), ['codepulse.ChallengeService']);
    const docs = reflection.generateMarkdownDocs();
    assert.strictEqual(docs.includes('## Service: codepulse.ChallengeService'), true);
    assert.strictEqual(docs.includes('GetChallenge'), true);
  });
});
