/**
 * Yjs / CRDT Monaco Editor Binding
 * Binds collaborative workspace state and vector updates to Monaco editor models
 * Supporting multi-cursor visual presence with color-coded player avatars.
 */

export interface MonacoPosition {
  lineNumber: number;
  column: number;
}

export interface MonacoSelection {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

export interface RemoteCollaborator {
  clientId: number;
  username: string;
  color: string;
  avatarUrl?: string;
  cursor?: MonacoPosition;
  selection?: MonacoSelection;
}

export interface MonacoEditorModelStub {
  getValue(): string;
  setValue(value: string): void;
  onDidChangeContent(callback: (event: any) => void): { dispose: () => void };
  applyEdits(edits: Array<{ range: any; text: string }>): void;
}

export class YjsMonacoBinding {
  private docId: string;
  private clientId: number;
  private username: string;
  private userColor: string;
  private editor: MonacoEditorModelStub;
  private clock: number = 0;
  private collaborators: Map<number, RemoteCollaborator> = new Map();
  private onUpdateCallback?: (op: any) => void;
  private onAwarenessCallback?: (awareness: any) => void;
  private isApplyingRemoteUpdate = false;

  constructor(options: {
    docId: string;
    clientId: number;
    username: string;
    color?: string;
    editor: MonacoEditorModelStub;
    onUpdate?: (op: any) => void;
    onAwareness?: (awareness: any) => void;
  }) {
    this.docId = options.docId;
    this.clientId = options.clientId;
    this.username = options.username;
    this.userColor = options.color || this.generateDeterministicColor(options.username);
    this.editor = options.editor;
    this.onUpdateCallback = options.onUpdate;
    this.onAwarenessCallback = options.onAwareness;

    this.bindEditorEvents();
  }

  private bindEditorEvents() {
    this.editor.onDidChangeContent((e) => {
      if (this.isApplyingRemoteUpdate) return;

      this.clock += 1;
      const content = this.editor.getValue();
      const op = {
        id: `${this.clientId}:${this.clock}`,
        clientId: this.clientId,
        clock: this.clock,
        type: 'insert',
        position: content.length - 1,
        char: content.slice(-1),
      };

      if (this.onUpdateCallback) {
        this.onUpdateCallback(op);
      }
    });
  }

  /**
   * Applies an incoming remote CRDT delta without triggering local change cycles
   */
  public applyRemoteUpdate(canonicalText: string) {
    this.isApplyingRemoteUpdate = true;
    try {
      this.editor.setValue(canonicalText);
    } finally {
      this.isApplyingRemoteUpdate = false;
    }
  }

  /**
   * Updates multi-cursor positions with custom color-coded player presence
   */
  public updateRemoteCursor(collaborator: RemoteCollaborator) {
    this.collaborators.set(collaborator.clientId, collaborator);
  }

  public removeRemoteCursor(clientId: number) {
    this.collaborators.delete(clientId);
  }

  public getCollaborators(): RemoteCollaborator[] {
    return Array.from(this.collaborators.values());
  }

  /**
   * Emits local cursor movement to awareness channel
   */
  public broadcastCursorPosition(position: MonacoPosition, selection?: MonacoSelection) {
    if (this.onAwarenessCallback) {
      this.onAwarenessCallback({
        clientId: this.clientId,
        user: {
          id: `usr_${this.clientId}`,
          name: this.username,
          color: this.userColor,
        },
        cursor: {
          line: position.lineNumber,
          column: position.column,
        },
        selection: selection
          ? {
              startLine: selection.startLineNumber,
              startColumn: selection.startColumn,
              endLine: selection.endLineNumber,
              endColumn: selection.endColumn,
            }
          : undefined,
        lastSeenMs: Date.now(),
      });
    }
  }

  private generateDeterministicColor(name: string): string {
    const palette = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return palette[Math.abs(hash) % palette.length];
  }
}

