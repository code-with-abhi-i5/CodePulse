import { Injectable, Logger } from '@nestjs/common';
import {
  ProtobufCompatibilityService,
  ProtobufSchemaDescriptor,
  CompatibilityLevel,
} from './protobuf-compatibility.service';

export interface RegisteredSchemaRecord {
  id: number;
  subject: string;
  version: number;
  schema: ProtobufSchemaDescriptor;
  registeredAt: number;
  compatibilityLevel: CompatibilityLevel;
}

export interface SchemaRegistryTelemetry {
  totalSubjectsCount: number;
  totalSchemasRegistered: number;
  totalEncodesExecuted: number;
  totalDecodesExecuted: number;
  incompatibleRejectionsCount: number;
}

@Injectable()
export class SchemaRegistryService {
  private readonly logger = new Logger(SchemaRegistryService.name);

  // Magic byte 0x00 for Confluent wire format
  private static readonly MAGIC_BYTE = 0x00;

  private schemaIdCounter = 1000;
  private readonly schemasById = new Map<number, RegisteredSchemaRecord>();
  private readonly schemasBySubject = new Map<string, RegisteredSchemaRecord[]>();
  private readonly subjectCompatibility = new Map<string, CompatibilityLevel>();

  private totalEncodes = 0;
  private totalDecodes = 0;
  private totalRejections = 0;

  constructor(private readonly compatibilityService: ProtobufCompatibilityService) {}

  public setCompatibilityLevel(subject: string, level: CompatibilityLevel): void {
    this.subjectCompatibility.set(subject, level);
  }

  public getCompatibilityLevel(subject: string): CompatibilityLevel {
    return this.subjectCompatibility.get(subject) || 'BACKWARD';
  }

  /**
   * Registers a new schema version under a subject.
   * Enforces backward compatibility validation against previous versions.
   */
  public registerSchema(
    subject: string,
    schema: ProtobufSchemaDescriptor,
  ): RegisteredSchemaRecord {
    const existingVersions = this.schemasBySubject.get(subject) || [];
    const level = this.getCompatibilityLevel(subject);

    if (existingVersions.length > 0) {
      const latestVersion = existingVersions[existingVersions.length - 1];
      const check = this.compatibilityService.checkCompatibility(
        latestVersion.schema,
        schema,
        level,
      );

      if (!check.isCompatible) {
        this.totalRejections++;
        throw new Error(
          `Schema registration rejected due to ${level} compatibility violations: ${check.violations.join('; ')}`,
        );
      }
    }

    const id = ++this.schemaIdCounter;
    const version = existingVersions.length + 1;

    const record: RegisteredSchemaRecord = {
      id,
      subject,
      version,
      schema,
      registeredAt: Date.now(),
      compatibilityLevel: level,
    };

    this.schemasById.set(id, record);

    if (!this.schemasBySubject.has(subject)) {
      this.schemasBySubject.set(subject, []);
    }
    this.schemasBySubject.get(subject)!.push(record);

    this.logger.log(
      `Schema registered for subject '${subject}' [Version: ${version}, Schema ID: ${id}, Msg: ${schema.messageName}]`,
    );

    return record;
  }

  public getSchemaById(id: number): RegisteredSchemaRecord | undefined {
    return this.schemasById.get(id);
  }

  public getLatestSchema(subject: string): RegisteredSchemaRecord | undefined {
    const list = this.schemasBySubject.get(subject);
    return list && list.length > 0 ? list[list.length - 1] : undefined;
  }

  /**
   * Serializes payload buffer into Confluent wire format:
   * [1 byte Magic 0x00] + [4 bytes Big-Endian Schema ID] + [Payload]
   */
  public encodeWireMessage(schemaId: number, payload: Buffer): Buffer {
    this.totalEncodes++;
    const header = Buffer.alloc(5);
    header.writeUInt8(SchemaRegistryService.MAGIC_BYTE, 0);
    header.writeUInt32BE(schemaId, 1);
    return Buffer.concat([header, payload]);
  }

  /**
   * Deserializes Confluent wire message:
   * Extracts 4-byte Schema ID and returns raw payload buffer.
   */
  public decodeWireMessage(buffer: Buffer): { schemaId: number; payload: Buffer } {
    this.totalDecodes++;
    if (buffer.length < 5) {
      throw new Error(`Invalid wire message length: ${buffer.length} bytes (expected >= 5)`);
    }

    const magic = buffer.readUInt8(0);
    if (magic !== SchemaRegistryService.MAGIC_BYTE) {
      throw new Error(`Invalid magic byte 0x${magic.toString(16)} (expected 0x00)`);
    }

    const schemaId = buffer.readUInt32BE(1);
    const payload = buffer.subarray(5);

    return { schemaId, payload };
  }

  public getTelemetry(): SchemaRegistryTelemetry {
    return {
      totalSubjectsCount: this.schemasBySubject.size,
      totalSchemasRegistered: this.schemasById.size,
      totalEncodesExecuted: this.totalEncodes,
      totalDecodesExecuted: this.totalDecodes,
      incompatibleRejectionsCount: this.totalRejections,
    };
  }
}
