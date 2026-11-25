import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ScimIdentityProvisioningGatewayService } from './sec-auth-42.service.ts';

describe('ScimIdentityProvisioningGatewayService (SEC-AUTH-42)', () => {
  it('validates SCIM 2.0 authorization and provisions valid user schemas', () => {
    const gateway = new ScimIdentityProvisioningGatewayService('valid-secret-token');

    assert.strictEqual(gateway.authorizeRequest('Bearer valid-secret-token'), true);
    assert.strictEqual(gateway.authorizeRequest('Bearer invalid-token'), false);

    const validPayload = {
      schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
      userName: 'john.doe@enterprise.com',
      emails: [{ value: 'john.doe@enterprise.com', primary: true }],
      active: true
    };

    const res = gateway.provisionUser(validPayload);
    assert.strictEqual(res.statusCode, 201);
    assert.ok(res.body.id);
    assert.strictEqual(res.body.userName, 'john.doe@enterprise.com');

    // Deprovision
    const deprov = gateway.deprovisionUser(res.body.id);
    assert.strictEqual(deprov.statusCode, 204);
    assert.strictEqual(gateway.getUser(res.body.id).active, false);
  });

  it('rejects malformed user payloads missing SCIM core schema URIs', () => {
    const gateway = new ScimIdentityProvisioningGatewayService();
    const badPayload = {
      schemas: ['urn:custom:schema'],
      userName: 'bad.user'
    };
    const res = gateway.provisionUser(badPayload);
    assert.strictEqual(res.statusCode, 400);
    assert.match(res.body.detail, /Missing required SCIM 2.0 User schema/i);
  });
});
