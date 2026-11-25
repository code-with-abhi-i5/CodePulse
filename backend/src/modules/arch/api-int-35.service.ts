/**
 * Architecture Service: API Response Streaming Serializer
 * Subsystem: Large Dataset JSON Serialization
 */

export class ApiResponseStreamingSerializerService {
  public *serializeArrayStream<T>(items: Iterable<T>): Generator<string, void, unknown> {
    yield '[';
    let isFirst = true;
    for (const item of items) {
      if (!isFirst) {
        yield ',';
      }
      yield JSON.stringify(item);
      isFirst = false;
    }
    yield ']';
  }
}
