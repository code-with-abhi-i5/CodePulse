import { describe, it, expect, vi } from 'vitest';
import { YjsMonacoBinding, MonacoEditorModelStub } from '../components/editor/yjs-monaco-binding';

describe('YjsMonacoBinding', () => {
  const createMockEditor = (initialValue = ''): MonacoEditorModelStub & { listeners: Array<(e: any) => void> } => {
    let content = initialValue;
    const listeners: Array<(e: any) => void> = [];

    return {
      listeners,
      getValue: () => content,
      setValue: (val: string) => {
        content = val;
      },
      onDidChangeContent: (cb: (e: any) => void) => {
        listeners.push(cb);
        return { dispose: () => {} };
      },
      applyEdits: () => {},
    };
  };

  it('binds editor content changes and emits delta operations', () => {
    const editor = createMockEditor('const x = ');
    const updateSpy = vi.fn();

    new YjsMonacoBinding({
      docId: 'doc_monaco_1',
      clientId: 1,
      username: 'dev_charlie',
      editor,
      onUpdate: updateSpy,
    });

    // Simulate keystroke in Monaco
    editor.setValue('const x = 5');
    editor.listeners.forEach((cb) => cb({}));

    expect(updateSpy).toHaveBeenCalledTimes(1);
    const op = updateSpy.mock.calls[0][0];
    expect(op.clientId).toBe(1);
    expect(op.clock).toBe(1);
    expect(op.char).toBe('5');
  });

  it('applies remote updates to editor without triggering recursive local update cycles', () => {
    const editor = createMockEditor('initial');
    const updateSpy = vi.fn();

    const binding = new YjsMonacoBinding({
      docId: 'doc_monaco_2',
      clientId: 2,
      username: 'dev_dave',
      editor,
      onUpdate: updateSpy,
    });

    binding.applyRemoteUpdate('canonical text from CRDT');
    expect(editor.getValue()).toBe('canonical text from CRDT');
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('manages remote multi-cursor presence with custom color-coded avatars', () => {
    const editor = createMockEditor();
    const binding = new YjsMonacoBinding({
      docId: 'doc_monaco_3',
      clientId: 3,
      username: 'dev_eve',
      editor,
    });

    binding.updateRemoteCursor({
      clientId: 99,
      username: 'rival_master',
      color: '#f59e0b',
      cursor: { lineNumber: 14, column: 2 },
    });

    const collaborators = binding.getCollaborators();
    expect(collaborators.length).toBe(1);
    expect(collaborators[0].username).toBe('rival_master');
    expect(collaborators[0].color).toBe('#f59e0b');

    binding.removeRemoteCursor(99);
    expect(binding.getCollaborators().length).toBe(0);
  });
});

