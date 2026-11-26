import { ToolCallChunk, ToolCallParseResult } from '../../types/ai';

export class StreamTokenParser {
  private buffer: string = '';
  private toolName: string = '';

  appendChunk(chunk: ToolCallChunk): ToolCallParseResult {
    if (chunk.name) this.toolName = chunk.name;
    this.buffer += chunk.argumentFragment;

    try {
      const parsed = JSON.parse(this.buffer);
      return {
        isComplete: true,
        toolName: this.toolName,
        args: parsed,
        rawBuffer: this.buffer
      };
    } catch {
      return {
        isComplete: false,
        toolName: this.toolName,
        args: {},
        rawBuffer: this.buffer
      };
    }
  }

  reset(): void {
    this.buffer = '';
    this.toolName = '';
  }
}
