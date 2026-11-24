import { Injectable, Logger } from '@nestjs/common';

export type CompatibilityLevel = 'BACKWARD' | 'BACKWARD_TRANSITIVE' | 'FORWARD' | 'FULL' | 'NONE';

export interface ProtobufFieldDescriptor {
  tag: number;
  name: string;
  type: 'string' | 'int32' | 'int64' | 'bool' | 'bytes' | 'float' | 'double' | 'message';
  rule: 'optional' | 'required' | 'repeated';
}

export interface ProtobufSchemaDescriptor {
  messageName: string;
  fields: ProtobufFieldDescriptor[];
}

export interface CompatibilityCheckResult {
  isCompatible: boolean;
  level: CompatibilityLevel;
  violations: string[];
  checkedFieldsCount: number;
}

@Injectable()
export class ProtobufCompatibilityService {
  private readonly logger = new Logger(ProtobufCompatibilityService.name);

  /**
   * Evaluates backward, forward, and full compatibility between two Protobuf schemas.
   * Confluent Schema Registry compliance standard.
   */
  public checkCompatibility(
    oldSchema: ProtobufSchemaDescriptor,
    newSchema: ProtobufSchemaDescriptor,
    level: CompatibilityLevel = 'BACKWARD',
  ): CompatibilityCheckResult {
    const violations: string[] = [];

    if (level === 'NONE') {
      return { isCompatible: true, level, violations: [], checkedFieldsCount: 0 };
    }

    const oldFieldsByTag = new Map<number, ProtobufFieldDescriptor>();
    for (const f of oldSchema.fields) {
      oldFieldsByTag.set(f.tag, f);
    }

    const newFieldsByTag = new Map<number, ProtobufFieldDescriptor>();
    for (const f of newSchema.fields) {
      newFieldsByTag.set(f.tag, f);
    }

    // Rule 1: Type change check on matching tags
    for (const [tag, oldField] of oldFieldsByTag.entries()) {
      const newField = newFieldsByTag.get(tag);
      if (newField) {
        if (oldField.type !== newField.type) {
          violations.push(
            `Field tag ${tag} ('${newField.name}') changed wire type from '${oldField.type}' to '${newField.type}'`,
          );
        }
        if (oldField.rule !== newField.rule) {
          violations.push(
            `Field tag ${tag} ('${newField.name}') changed cardinality rule from '${oldField.rule}' to '${newField.rule}'`,
          );
        }
      }
    }

    // BACKWARD Compatibility Rules:
    // New schema must be able to read data produced by old schema.
    if (level === 'BACKWARD' || level === 'BACKWARD_TRANSITIVE' || level === 'FULL') {
      // Rule 2: Cannot delete a required field from old schema
      for (const [tag, oldField] of oldFieldsByTag.entries()) {
        if (oldField.rule === 'required' && !newFieldsByTag.has(tag)) {
          violations.push(
            `Required field '${oldField.name}' (tag ${tag}) was deleted in candidate schema`,
          );
        }
      }

      // Rule 3: Cannot introduce a new REQUIRED field in candidate schema
      for (const [tag, newField] of newFieldsByTag.entries()) {
        if (newField.rule === 'required' && !oldFieldsByTag.has(tag)) {
          violations.push(
            `New field '${newField.name}' (tag ${tag}) cannot be 'required' in backward-compatible schema; must be 'optional'`,
          );
        }
      }
    }

    // FORWARD Compatibility Rules:
    // Old schema must be able to read data produced by new schema.
    if (level === 'FORWARD' || level === 'FULL') {
      // Rule 4: Cannot delete optional fields if old consumers require them
      for (const [tag, newField] of newFieldsByTag.entries()) {
        const oldField = oldFieldsByTag.get(tag);
        if (oldField && oldField.rule === 'required' && newField.rule !== 'required') {
          violations.push(
            `Field '${newField.name}' (tag ${tag}) was required in old schema but optional in new schema`,
          );
        }
      }
    }

    const isCompatible = violations.length === 0;

    if (!isCompatible) {
      this.logger.warn(
        `Incompatible schema change rejected for message '${newSchema.messageName}': ${violations.join('; ')}`,
      );
    }

    return {
      isCompatible,
      level,
      violations,
      checkedFieldsCount: oldSchema.fields.length + newSchema.fields.length,
    };
  }
}
