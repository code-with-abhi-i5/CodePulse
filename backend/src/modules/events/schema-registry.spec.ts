import { SchemaRegistryService } from './schema-registry.service';
import {
  ProtobufCompatibilityService,
  ProtobufSchemaDescriptor,
} from './protobuf-compatibility.service';

describe('Confluent-Compatible Schema Registry Client & Protobuf Linter (#1410)', () => {
  let compatibilityService: ProtobufCompatibilityService;
  let registryService: SchemaRegistryService;

  beforeEach(() => {
    compatibilityService = new ProtobufCompatibilityService();
    registryService = new SchemaRegistryService(compatibilityService);
  });

  const baseUserSchema: ProtobufSchemaDescriptor = {
    messageName: 'UserEvent',
    fields: [
      { tag: 1, name: 'userId', type: 'string', rule: 'required' },
      { tag: 2, name: 'email', type: 'string', rule: 'required' },
      { tag: 3, name: 'age', type: 'int32', rule: 'optional' },
    ],
  };

  describe('ProtobufCompatibilityService Verification', () => {
    it('accepts adding new OPTIONAL fields under BACKWARD compatibility', () => {
      const candidateSchema: ProtobufSchemaDescriptor = {
        messageName: 'UserEvent',
        fields: [
          ...baseUserSchema.fields,
          { tag: 4, name: 'nickname', type: 'string', rule: 'optional' },
        ],
      };

      const result = compatibilityService.checkCompatibility(
        baseUserSchema,
        candidateSchema,
        'BACKWARD',
      );

      expect(result.isCompatible).toBe(true);
      expect(result.violations.length).toBe(0);
    });

    it('rejects adding new REQUIRED fields under BACKWARD compatibility', () => {
      const candidateSchema: ProtobufSchemaDescriptor = {
        messageName: 'UserEvent',
        fields: [
          ...baseUserSchema.fields,
          { tag: 4, name: 'phoneNumber', type: 'string', rule: 'required' },
        ],
      };

      const result = compatibilityService.checkCompatibility(
        baseUserSchema,
        candidateSchema,
        'BACKWARD',
      );

      expect(result.isCompatible).toBe(false);
      expect(result.violations[0]).toContain("cannot be 'required'");
    });

    it('rejects deleting an existing REQUIRED field under BACKWARD compatibility', () => {
      const candidateSchema: ProtobufSchemaDescriptor = {
        messageName: 'UserEvent',
        fields: [
          { tag: 1, name: 'userId', type: 'string', rule: 'required' },
          // tag 2 (email) deleted!
          { tag: 3, name: 'age', type: 'int32', rule: 'optional' },
        ],
      };

      const result = compatibilityService.checkCompatibility(
        baseUserSchema,
        candidateSchema,
        'BACKWARD',
      );

      expect(result.isCompatible).toBe(false);
      expect(result.violations[0]).toContain("Required field 'email' (tag 2) was deleted");
    });

    it('rejects altering field wire type on the same tag number', () => {
      const candidateSchema: ProtobufSchemaDescriptor = {
        messageName: 'UserEvent',
        fields: [
          { tag: 1, name: 'userId', type: 'string', rule: 'required' },
          { tag: 2, name: 'email', type: 'string', rule: 'required' },
          { tag: 3, name: 'age', type: 'string', rule: 'optional' }, // changed from int32 to string!
        ],
      };

      const result = compatibilityService.checkCompatibility(
        baseUserSchema,
        candidateSchema,
        'BACKWARD',
      );

      expect(result.isCompatible).toBe(false);
      expect(result.violations[0]).toContain("changed wire type from 'int32' to 'string'");
    });
  });

  describe('SchemaRegistryService Lifecycle & Wire Protocol', () => {
    it('registers initial v1 schema and increments to v2 on compatible evolution', () => {
      const subject = 'user-mutations-value';
      const v1 = registryService.registerSchema(subject, baseUserSchema);

      expect(v1.version).toBe(1);
      expect(v1.id).toBeGreaterThanOrEqual(1001);
      expect(v1.subject).toBe(subject);

      const compatibleV2: ProtobufSchemaDescriptor = {
        messageName: 'UserEvent',
        fields: [
          ...baseUserSchema.fields,
          { tag: 4, name: 'tier', type: 'string', rule: 'optional' },
        ],
      };

      const v2 = registryService.registerSchema(subject, compatibleV2);
      expect(v2.version).toBe(2);
      expect(v2.id).toBe(v1.id + 1);

      const latest = registryService.getLatestSchema(subject);
      expect(latest?.version).toBe(2);
    });

    it('throws error and increments rejection count on incompatible schema registration attempt', () => {
      const subject = 'strict-subject-value';
      registryService.registerSchema(subject, baseUserSchema);

      const breakingSchema: ProtobufSchemaDescriptor = {
        messageName: 'UserEvent',
        fields: [
          { tag: 1, name: 'userId', type: 'int64', rule: 'required' }, // type mutation!
        ],
      };

      expect(() => registryService.registerSchema(subject, breakingSchema)).toThrow(
        /compatibility violations/,
      );

      const telemetry = registryService.getTelemetry();
      expect(telemetry.incompatibleRejectionsCount).toBe(1);
    });

    it('encodes and decodes payload with Confluent 5-byte wire protocol (Magic 0x00 + Schema ID)', () => {
      const schemaId = 1042;
      const rawPayload = Buffer.from('hello protobuf payload bytes');

      const encoded = registryService.encodeWireMessage(schemaId, rawPayload);

      expect(encoded.length).toBe(5 + rawPayload.length);
      expect(encoded.readUInt8(0)).toBe(0x00); // Magic byte
      expect(encoded.readUInt32BE(1)).toBe(1042); // Schema ID

      const decoded = registryService.decodeWireMessage(encoded);
      expect(decoded.schemaId).toBe(1042);
      expect(decoded.payload.toString('utf8')).toBe('hello protobuf payload bytes');
    });

    it('rejects decoding malformed wire buffers', () => {
      const shortBuffer = Buffer.from([0x00, 0x01]);
      expect(() => registryService.decodeWireMessage(shortBuffer)).toThrow(/Invalid wire message length/);

      const wrongMagic = Buffer.from([0xFF, 0x00, 0x00, 0x01, 0x00, 0xAA]);
      expect(() => registryService.decodeWireMessage(wrongMagic)).toThrow(/Invalid magic byte/);
    });
  });
});
