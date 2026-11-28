export interface ErField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'Date' | 'json' | string;
  rawType: string;
  isId?: boolean;
  isUnique?: boolean;
  isRequired: boolean;
  isList?: boolean;
  defaultValue?: any;
  isEmail?: boolean;
  isUuid?: boolean;
  description?: string;
}

export interface ErMethod {
  name: string;
  returnType: string;
  visibility: '+' | '-' | '#' | '~';
  parameters?: Array<{ name: string; type: string }>;
}

export interface ErRelation {
  sourceEntity: string;
  targetEntity: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
  sourceField: string;
  targetField: string;
  relationName?: string;
  onDelete?: 'Cascade' | 'SetNull' | 'Restrict';
}

export interface ErEntity {
  name: string;
  tableName: string;
  fields: ErField[];
  methods: ErMethod[];
  relations: ErRelation[];
  description?: string;
}

export interface ErGraph {
  entities: Map<string, ErEntity>;
  relations: ErRelation[];
  diagramType: 'classDiagram' | 'flowchart' | 'erDiagram' | 'unknown';
}

export class MermaidDiagramParser {
  /**
   * Parses a Mermaid string (Class Diagram or Flowchart) into an ER Graph.
   */
  public parse(diagramStr: string): ErGraph {
    const trimmed = diagramStr.trim();
    const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0 && !l.startsWith('%%'));

    const graph: ErGraph = {
      entities: new Map<string, ErEntity>(),
      relations: [],
      diagramType: 'unknown',
    };

    if (lines.length === 0) return graph;

    const firstLine = lines[0].toLowerCase();
    if (firstLine.includes('classdiagram')) {
      graph.diagramType = 'classDiagram';
      this.parseClassDiagram(lines.slice(1), graph);
    } else if (
      firstLine.startsWith('graph') ||
      firstLine.startsWith('flowchart')
    ) {
      graph.diagramType = 'flowchart';
      this.parseFlowchart(lines.slice(1), graph);
    } else {
      // Auto-detect based on syntax features
      const hasClass = lines.some((l) => l.includes('class ') || l.includes('::') || l.includes('<|--') || l.includes('*--'));
      if (hasClass) {
        graph.diagramType = 'classDiagram';
        this.parseClassDiagram(lines, graph);
      } else {
        graph.diagramType = 'flowchart';
        this.parseFlowchart(lines, graph);
      }
    }

    this.postProcessRelationships(graph);
    return graph;
  }

  private parseClassDiagram(lines: string[], graph: ErGraph): void {
    let currentClass: ErEntity | null = null;

    for (const line of lines) {
      if (line === 'classDiagram' || line.startsWith('%%')) continue;

      // Match class definition start: "class User {" or "class User"
      const classDefMatch = line.match(/^class\s+([A-Za-z0-9_]+)\s*(\{)?$/);
      if (classDefMatch) {
        const className = this.sanitizeIdentifier(classDefMatch[1]);
        currentClass = this.getOrCreateEntity(graph, className);
        continue;
      }

      // End of class block
      if (line === '}' && currentClass) {
        currentClass = null;
        continue;
      }

      // Inside class block: member lines
      if (currentClass) {
        this.parseClassMember(line, currentClass);
        continue;
      }

      // Standalone member syntax: "User : +String email" or "User : id"
      const memberMatch = line.match(/^([A-Za-z0-9_]+)\s*:\s*(.+)$/);
      if (memberMatch) {
        const entityName = this.sanitizeIdentifier(memberMatch[1]);
        const memberDef = memberMatch[2].trim();
        const entity = this.getOrCreateEntity(graph, entityName);
        this.parseClassMember(memberDef, entity);
        continue;
      }

      // Relationship syntax: "User "1" --> "*" Post : creates" or "A <|-- B"
      this.parseClassRelation(line, graph);
    }
  }

  private parseClassMember(rawMember: string, entity: ErEntity): void {
    let member = rawMember.trim();
    if (member.startsWith('{') || member.startsWith('}')) return;

    // Check if it's a method: e.g. "+login(credentials) Boolean"
    if (member.includes('(') && member.includes(')')) {
      const methodMatch = member.match(/^([+\-#~])?\s*([A-Za-z0-9_]+)\s*\((.*?)\)\s*([A-Za-z0-9_<>[\]]+)?$/);
      if (methodMatch) {
        const visibility = (methodMatch[1] as any) || '+';
        const name = methodMatch[2];
        const returnType = methodMatch[4] || 'void';
        entity.methods.push({ name, returnType, visibility });
        return;
      }
    }

    // Property parsing: "+String email" or "email: String" or "+Int age"
    let visibility: '+' | '-' | '#' | '~' = '+';
    if (['+', '-', '#', '~'].includes(member[0])) {
      visibility = member[0] as any;
      member = member.substring(1).trim();
    }

    // Form 1: "type name" e.g. "String email" or "Int age"
    const typeFirstMatch = member.match(/^([A-Za-z0-9_<>[\]]+)\s+([A-Za-z0-9_]+)$/);
    if (typeFirstMatch) {
      const rawType = typeFirstMatch[1];
      const fieldName = typeFirstMatch[2];
      this.addField(entity, fieldName, rawType);
      return;
    }

    // Form 2: "name: type" e.g. "email: string"
    const nameFirstMatch = member.match(/^([A-Za-z0-9_]+)\s*:\s*([A-Za-z0-9_<>[\]]+)$/);
    if (nameFirstMatch) {
      const fieldName = nameFirstMatch[1];
      const rawType = nameFirstMatch[2];
      this.addField(entity, fieldName, rawType);
      return;
    }

    // Form 3: simple name e.g. "email"
    const bareNameMatch = member.match(/^([A-Za-z0-9_]+)$/);
    if (bareNameMatch) {
      const fieldName = bareNameMatch[1];
      this.addField(entity, fieldName, 'String');
    }
  }

  private addField(entity: ErEntity, fieldName: string, rawType: string): void {
    const isId = fieldName.toLowerCase() === 'id' || fieldName.toLowerCase().endsWith('_id');
    const isEmail = fieldName.toLowerCase().includes('email');
    const isUnique = isId || isEmail || fieldName.toLowerCase().includes('slug');
    const normalizedType = this.normalizeType(rawType);
    const isList = rawType.endsWith('[]') || rawType.startsWith('List<') || rawType.startsWith('Array<');

    // Avoid duplicate fields
    if (entity.fields.some((f) => f.name === fieldName)) return;

    entity.fields.push({
      name: fieldName,
      type: normalizedType,
      rawType,
      isId,
      isUnique,
      isRequired: !fieldName.endsWith('?'),
      isList,
      isEmail,
      isUuid: isId && normalizedType === 'string',
    });
  }

  private parseClassRelation(line: string, graph: ErGraph): void {
    // Regex for class diagram relations:
    // Examples:
    // Customer "1" --> "*" Ticket : places
    // Order *-- LineItem : contains
    // User <|-- Admin : inherits
    const relRegex = /([A-Za-z0-9_]+)\s*(?:"([^"]*)")?\s*([<|*o\-]*-+[>|*o\-]*)\s*(?:"([^"]*)")?\s*([A-Za-z0-9_]+)(?:\s*:\s*([A-Za-z0-9_\s]+))?/;
    const match = line.match(relRegex);
    if (!match) return;

    const sourceName = this.sanitizeIdentifier(match[1]);
    const sourceCard = match[2] || '';
    const arrow = match[3];
    const targetCard = match[4] || '';
    const targetName = this.sanitizeIdentifier(match[5]);
    const label = (match[6] || '').trim();

    this.getOrCreateEntity(graph, sourceName);
    this.getOrCreateEntity(graph, targetName);

    let type: ErRelation['type'] = 'one-to-many';
    if (sourceCard.includes('*') && targetCard.includes('*')) {
      type = 'many-to-many';
    } else if (
      (sourceCard.includes('1') && targetCard.includes('1')) ||
      (arrow.includes('--') && !arrow.includes('>') && !targetCard.includes('*'))
    ) {
      type = 'one-to-one';
    } else if (targetCard.includes('*') || arrow.includes('-->') || arrow.includes('*--')) {
      type = 'one-to-many';
    }

    const relation: ErRelation = {
      sourceEntity: sourceName,
      targetEntity: targetName,
      type,
      sourceField: this.toCamelCase(targetName) + (type === 'one-to-many' ? 's' : ''),
      targetField: this.toCamelCase(sourceName),
      relationName: label || `${sourceName}To${targetName}`,
      onDelete: arrow.includes('*--') ? 'Cascade' : 'Restrict',
    };

    graph.relations.push(relation);
  }

  private parseFlowchart(lines: string[], graph: ErGraph): void {
    // Matches flowchart edges: A[User] --> B[Order] or A -->|submits| B
    const edgeRegex = /([A-Za-z0-9_]+)(?:\[(.*?)\]|\((.*?)\)|\{(.*?)\})?\s*-->\s*(?:\|(.*?)\|)?\s*([A-Za-z0-9_]+)(?:\[(.*?)\]|\((.*?)\)|\{(.*?)\})?/;

    for (const line of lines) {
      if (line.startsWith('subgraph') || line.startsWith('end')) continue;

      const match = line.match(edgeRegex);
      if (match) {
        const sourceId = match[1];
        const sourceLabel = match[2] || match[3] || match[4] || sourceId;
        const edgeLabel = (match[5] || '').trim();
        const targetId = match[6];
        const targetLabel = match[7] || match[8] || match[9] || targetId;

        const sourceEntityName = this.sanitizeIdentifier(sourceLabel);
        const targetEntityName = this.sanitizeIdentifier(targetLabel);

        const source = this.getOrCreateEntity(graph, sourceEntityName);
        const target = this.getOrCreateEntity(graph, targetEntityName);

        // Ensure default fields exist
        this.ensureDefaultEntityFields(source);
        this.ensureDefaultEntityFields(target);

        const relation: ErRelation = {
          sourceEntity: sourceEntityName,
          targetEntity: targetEntityName,
          type: 'one-to-many',
          sourceField: this.toCamelCase(targetEntityName) + 's',
          targetField: this.toCamelCase(sourceEntityName),
          relationName: edgeLabel || `${sourceEntityName}To${targetEntityName}`,
        };

        graph.relations.push(relation);
      } else {
        // Individual node declaration: UserNode["User Profile"]
        const nodeMatch = line.match(/^([A-Za-z0-9_]+)\[(.*?)\]$/);
        if (nodeMatch) {
          const entityName = this.sanitizeIdentifier(nodeMatch[2] || nodeMatch[1]);
          const entity = this.getOrCreateEntity(graph, entityName);
          this.ensureDefaultEntityFields(entity);
        }
      }
    }
  }

  private ensureDefaultEntityFields(entity: ErEntity): void {
    if (entity.fields.length === 0) {
      this.addField(entity, 'id', 'String');
      this.addField(entity, 'name', 'String');
      this.addField(entity, 'createdAt', 'DateTime');
      this.addField(entity, 'updatedAt', 'DateTime');
    }
  }

  private postProcessRelationships(graph: ErGraph): void {
    for (const rel of graph.relations) {
      const source = graph.entities.get(rel.sourceEntity);
      const target = graph.entities.get(rel.targetEntity);

      if (source && !source.relations.some((r) => r.relationName === rel.relationName)) {
        source.relations.push(rel);
      }
      if (target && !target.relations.some((r) => r.relationName === rel.relationName)) {
        target.relations.push(rel);
      }

      // Add ID and timestamp fields if missing
      if (source) this.ensureIdAndTimestamps(source);
      if (target) this.ensureIdAndTimestamps(target);
    }

    // Ensure all entities have at least id, createdAt, updatedAt
    for (const entity of graph.entities.values()) {
      this.ensureIdAndTimestamps(entity);
    }
  }

  private ensureIdAndTimestamps(entity: ErEntity): void {
    if (!entity.fields.some((f) => f.isId)) {
      entity.fields.unshift({
        name: 'id',
        type: 'string',
        rawType: 'String',
        isId: true,
        isUnique: true,
        isRequired: true,
        isUuid: true,
      });
    }
    if (!entity.fields.some((f) => f.name === 'createdAt')) {
      entity.fields.push({
        name: 'createdAt',
        type: 'Date',
        rawType: 'DateTime',
        isRequired: true,
      });
    }
    if (!entity.fields.some((f) => f.name === 'updatedAt')) {
      entity.fields.push({
        name: 'updatedAt',
        type: 'Date',
        rawType: 'DateTime',
        isRequired: true,
      });
    }
  }

  private getOrCreateEntity(graph: ErGraph, name: string): ErEntity {
    const cleanName = this.toPascalCase(name);
    let entity = graph.entities.get(cleanName);
    if (!entity) {
      entity = {
        name: cleanName,
        tableName: this.toSnakeCase(cleanName) + 's',
        fields: [],
        methods: [],
        relations: [],
      };
      graph.entities.set(cleanName, entity);
    }
    return entity;
  }

  private sanitizeIdentifier(str: string): string {
    return str.replace(/[^A-Za-z0-9_]/g, '');
  }

  private toPascalCase(str: string): string {
    return str
      .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
      .replace(/^[a-z]/, (c) => c.toUpperCase());
  }

  private toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }

  private toSnakeCase(str: string): string {
    return str
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
      .toLowerCase();
  }

  private normalizeType(raw: string): string {
    const lower = raw.toLowerCase().replace(/[[\]]/g, '');
    if (['string', 'text', 'varchar', 'uuid'].includes(lower)) return 'string';
    if (['int', 'integer', 'number', 'float', 'double', 'bigint', 'decimal'].includes(lower)) return 'number';
    if (['bool', 'boolean'].includes(lower)) return 'boolean';
    if (['date', 'datetime', 'timestamp'].includes(lower)) return 'Date';
    if (['json', 'jsonb', 'object'].includes(lower)) return 'json';
    return raw;
  }
}
