/**
 * Architecture Service: Prisma Multi-Schema Isolation Support
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-45]
 */

export class PrismaMultiSchemaRouterService {
  private schemaMap: Map<string, string>;

  constructor() {
    this.schemaMap = new Map([
      ['User', 'identity'],
      ['Profile', 'identity'],
      ['Session', 'identity'],
      ['Battle', 'battles'],
      ['Challenge', 'battles'],
      ['Submission', 'battles'],
      ['TelemetryEvent', 'telemetry'],
      ['AuditLog', 'telemetry']
    ]);
  }

  public resolveSchemaForModel(modelName: string): string {
    const schema = this.schemaMap.get(modelName);
    if (!schema) {
      throw new Error(`Unknown model '${modelName}'; schema mapping not found`);
    }
    return schema;
  }

  public qualifyTableName(modelName: string, tableName: string): string {
    const schema = this.resolveSchemaForModel(modelName);
    return `"${schema}"."${tableName}"`;
  }
}
