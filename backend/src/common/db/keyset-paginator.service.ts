import { KeysetCursor } from '../../types/db';

export class KeysetPaginatorService {
  encodeCursor(score: number, id: string): string {
    const raw = score + ':' + id;
    return Buffer.from(raw, 'utf8').toString('base64');
  }

  decodeCursor(cursor: string): { score: number; id: string } | null {
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf8');
      const parts = decoded.split(':');
      if (parts.length === 2 && !isNaN(Number(parts[0]))) {
        return { score: Number(parts[0]), id: parts[1] };
      }
      return null;
    } catch {
      return null;
    }
  }

  buildWhereClause(score: number, id: string): { sql: string; params: any[] } {
    return {
      sql: '(score < ? OR (score = ? AND id < ?))',
      params: [score, score, id]
    };
  }
}
