import fs from 'fs';
import { Readable } from 'stream';

export interface StreamRange {
  start: number;
  end: number;
  totalSize: number;
  chunkSize: number;
}

export interface StreamResponse {
  statusCode: number;
  headers: Record<string, string | number>;
  stream: Readable;
}

export class ZeroCopyReplayStreamerService {
  private readonly defaultChunkSize: number;

  constructor(defaultChunkSize = 64 * 1024) {
    this.defaultChunkSize = defaultChunkSize;
  }

  public parseRangeHeader(rangeHeader: string | undefined, totalSize: number): StreamRange | null {
    if (!rangeHeader || !rangeHeader.startsWith('bytes=')) {
      return null;
    }

    const parts = rangeHeader.replace('bytes=', '').split('-');
    const rawStart = parts[0]?.trim();
    const rawEnd = parts[1]?.trim();

    let start = 0;
    let end = totalSize - 1;

    if (rawStart && rawEnd) {
      start = parseInt(rawStart, 10);
      end = parseInt(rawEnd, 10);
    } else if (rawStart && !rawEnd) {
      start = parseInt(rawStart, 10);
      end = totalSize - 1;
    } else if (!rawStart && rawEnd) {
      // Suffix byte range
      const suffix = parseInt(rawEnd, 10);
      start = Math.max(0, totalSize - suffix);
      end = totalSize - 1;
    }

    if (isNaN(start) || isNaN(end) || start > end || start >= totalSize || end >= totalSize) {
      return null;
    }

    return {
      start,
      end,
      totalSize,
      chunkSize: (end - start) + 1
    };
  }

  public streamBuffer(buffer: Buffer, rangeHeader?: string, mimeType = 'video/mp4'): StreamResponse {
    const totalSize = buffer.length;
    const range = this.parseRangeHeader(rangeHeader, totalSize);

    if (range) {
      const slice = buffer.subarray(range.start, range.end + 1);
      const stream = Readable.from(slice);

      return {
        statusCode: 206, // Partial Content
        headers: {
          'Content-Range': `bytes ${range.start}-${range.end}/${totalSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': range.chunkSize,
          'Content-Type': mimeType
        },
        stream
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Accept-Ranges': 'bytes',
        'Content-Length': totalSize,
        'Content-Type': mimeType
      },
      stream: Readable.from(buffer)
    };
  }
}
