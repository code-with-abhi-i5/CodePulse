import { Injectable, Logger } from '@nestjs/common';
import { CrdtUpdateMessage } from '../../../src/types/realtime';

@Injectable()
export class CrdtYjsService {
  private readonly logger = new Logger(CrdtYjsService.name);
  private documents: Map<string, { content: string; clock: number; stateVector: number[] }> = new Map();

  public initializeDocument(documentId: string, initialText = ''): void {
    this.documents.set(documentId, {
      content: initialText,
      clock: 0,
      stateVector: [0, 0, 0]
    });
  }

  public applyUpdate(update: CrdtUpdateMessage): { success: boolean; newClock: number; currentText: string } {
    let doc = this.documents.get(update.documentId);
    if (!doc) {
      this.initializeDocument(update.documentId);
      doc = this.documents.get(update.documentId)!;
    }

    doc.clock = Math.max(doc.clock, update.clock) + 1;
    doc.content += `\n[Update from ${update.clientId}]`;
    return {
      success: true,
      newClock: doc.clock,
      currentText: doc.content
    };
  }

  public getDocumentSnapshot(documentId: string): string | null {
    const doc = this.documents.get(documentId);
    return doc ? doc.content : null;
  }
}
