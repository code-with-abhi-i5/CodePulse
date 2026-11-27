export interface CompressedChunk {
  encoding: 'RLE' | 'DELTA' | 'RAW';
  originalLength: number;
  compressedSize: number;
  data: Buffer;
}

export class ColumnChunkCompressorService {
  public compressRLE(values: number[]): CompressedChunk {
    if (values.length === 0) {
      return { encoding: 'RLE', originalLength: 0, compressedSize: 0, data: Buffer.alloc(0) };
    }

    const runs: { count: number; value: number }[] = [];
    let currentVal = values[0];
    let currentCount = 1;

    for (let i = 1; i < values.length; i++) {
      if (values[i] === currentVal && currentCount < 65535) {
        currentCount++;
      } else {
        runs.push({ count: currentCount, value: currentVal });
        currentVal = values[i];
        currentCount = 1;
      }
    }
    runs.push({ count: currentCount, value: currentVal });

    // Pack: each run = 2 bytes count (UInt16BE) + 4 bytes value (Int32BE)
    const buf = Buffer.alloc(runs.length * 6);
    let offset = 0;
    for (const run of runs) {
      buf.writeUInt16BE(run.count, offset);
      buf.writeInt32BE(run.value, offset + 2);
      offset += 6;
    }

    return {
      encoding: 'RLE',
      originalLength: values.length,
      compressedSize: buf.length,
      data: buf
    };
  }

  public decompressRLE(chunk: CompressedChunk): number[] {
    const result: number[] = [];
    const buf = chunk.data;
    let offset = 0;
    while (offset < buf.length) {
      const count = buf.readUInt16BE(offset);
      const val = buf.readInt32BE(offset + 2);
      for (let i = 0; i < count; i++) {
        result.push(val);
      }
      offset += 6;
    }
    return result;
  }

  public compressDelta(values: number[]): CompressedChunk {
    if (values.length === 0) {
      return { encoding: 'DELTA', originalLength: 0, compressedSize: 0, data: Buffer.alloc(0) };
    }

    // First element is base (4 bytes Int32BE), subsequent are deltas (2 bytes Int16BE or 4 bytes)
    const buf = Buffer.alloc(4 + (values.length - 1) * 4);
    buf.writeInt32BE(values[0], 0);

    let offset = 4;
    for (let i = 1; i < values.length; i++) {
      const delta = values[i] - values[i - 1];
      buf.writeInt32BE(delta, offset);
      offset += 4;
    }

    return {
      encoding: 'DELTA',
      originalLength: values.length,
      compressedSize: buf.length,
      data: buf
    };
  }

  public decompressDelta(chunk: CompressedChunk): number[] {
    if (chunk.originalLength === 0) return [];
    const buf = chunk.data;
    const base = buf.readInt32BE(0);
    const result: number[] = [base];

    let current = base;
    let offset = 4;
    for (let i = 1; i < chunk.originalLength; i++) {
      const delta = buf.readInt32BE(offset);
      current += delta;
      result.push(current);
      offset += 4;
    }

    return result;
  }
}
