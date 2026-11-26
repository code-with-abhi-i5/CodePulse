import { NormalizedAiResponse } from '../../types/ai';

export class AiResponseFormatNormalizer {
  normalizeResponse(rawResponse: string): NormalizedAiResponse {
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const extractedCodeBlocks: Array<{ language: string; code: string }> = [];

    let match;
    while ((match = codeBlockRegex.exec(rawResponse)) !== null) {
      extractedCodeBlocks.push({
        language: match[1] || 'text',
        code: match[2].trim()
      });
    }

    const isProperlyStructured = extractedCodeBlocks.length > 0;

    return {
      markdown: rawResponse.trim(),
      extractedCodeBlocks,
      isProperlyStructured
    };
  }
}
