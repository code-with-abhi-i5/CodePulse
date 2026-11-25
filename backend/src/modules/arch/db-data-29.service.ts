/**
 * Architecture Service: Database Query Result Cursor Streaming Serializer
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-29]
 */

export class CursorStreamingSerializerService {
  public async *streamJsonRows<T>(
    cursorFn: (batchSize: number, lastId?: string) => Promise<Array<T & { id: string }>>,
    batchSize: number = 100
  ): AsyncGenerator<string, void, unknown> {
    let lastId: string | undefined = undefined;
    let isFirst = true;

    yield '[';

    while (true) {
      const batch = await cursorFn(batchSize, lastId);
      if (batch.length === 0) break;

      for (const item of batch) {
        const prefix = isFirst ? '' : ',';
        isFirst = false;
        yield prefix + JSON.stringify(item);
        lastId = item.id;
      }

      if (batch.length < batchSize) break;
    }

    yield ']';
  }
}
