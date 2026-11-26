import { CodeChunk } from '../../types/ai';

export class AstAwareDocumentChunker {
  chunkTypeScriptFile(fileContent: string): CodeChunk[] {
    const chunks: CodeChunk[] = [];
    const lines = fileContent.split('\n');

    let currentChunkStart = 0;
    let currentType: 'class' | 'function' | 'interface' | 'module' = 'module';
    let currentName = 'top-level';

    lines.forEach((line, idx) => {
      if (line.includes('class ')) {
        currentType = 'class';
        currentName = line.match(/class\s+([a-zA-Z0-9_]+)/)?.[1] || 'anonymous';
        currentChunkStart = idx;
      } else if (line.includes('function ') || line.includes('const ') && line.includes(' = (')) {
        currentType = 'function';
        currentName = line.match(/(?:function|const)\s+([a-zA-Z0-9_]+)/)?.[1] || 'anonymous';
        currentChunkStart = idx;
      } else if (line.includes('interface ')) {
        currentType = 'interface';
        currentName = line.match(/interface\s+([a-zA-Z0-9_]+)/)?.[1] || 'anonymous';
        currentChunkStart = idx;
      }
    });

    chunks.push({
      chunkId: 'chunk-01',
      nodeType: currentType,
      name: currentName,
      content: fileContent,
      startLine: currentChunkStart + 1,
      endLine: lines.length,
      tokenCount: Math.round(fileContent.length / 4)
    });

    return chunks;
  }
}
