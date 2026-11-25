/**
 * Architecture Service: gRPC Protobuf Schema Compatibility Checker
 * Subsystem: Build-Time Contract Verification
 */

export interface ProtoField {
  tag: number;
  name: string;
  type: string;
}

export class GrpcProtobufCompatibilityLinterService {
  public checkCompatibility(
    oldFields: ProtoField[],
    newFields: ProtoField[]
  ): { compatible: boolean; breakingChanges: string[] } {
    const breaking: string[] = [];
    const newFieldMap = new Map<number, ProtoField>(newFields.map(f => [f.tag, f]));

    for (const old of oldFields) {
      const match = newFieldMap.get(old.tag);
      if (!match) {
        breaking.push(`Field '${old.name}' (tag ${old.tag}) was removed`);
      } else if (match.type !== old.type) {
        breaking.push(`Field '${old.name}' changed type from ${old.type} to ${match.type}`);
      }
    }

    return {
      compatible: breaking.length === 0,
      breakingChanges: breaking
    };
  }
}
