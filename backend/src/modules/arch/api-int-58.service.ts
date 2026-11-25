/**
 * Architecture Service: REST API Sorting Parameter Parser
 * Subsystem: API Query Parsing & Database Interop
 */

export interface SortField {
  field: string;
  direction: 'ASC' | 'DESC';
}

export class RestSortParameterParserService {
  public parse(sortQuery: string): SortField[] {
    if (!sortQuery || !sortQuery.trim()) return [];

    const tokens = sortQuery.split(',').map(t => t.trim()).filter(Boolean);
    const result: SortField[] = [];

    for (const token of tokens) {
      if (token.startsWith('-')) {
        result.push({ field: token.slice(1), direction: 'DESC' });
      } else if (token.startsWith('+')) {
        result.push({ field: token.slice(1), direction: 'ASC' });
      } else {
        result.push({ field: token, direction: 'ASC' });
      }
    }

    return result;
  }
}
