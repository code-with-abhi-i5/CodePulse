/**
 * Architecture Service: REST API Batch Execution Engine
 * Subsystem: API Gateway Round-Trip Reduction
 */

export interface BatchSubRequest {
  id: string;
  method: 'GET' | 'POST';
  path: string;
  body?: unknown;
}

export interface BatchSubResponse {
  id: string;
  status: number;
  body: unknown;
}

export class ApiBatchExecutionService {
  private readonly maxBatchSize: number;

  constructor(maxBatchSize = 20) {
    this.maxBatchSize = maxBatchSize;
  }

  public async executeBatch(
    requests: BatchSubRequest[],
    dispatcher: (req: BatchSubRequest) => Promise<{ status: number; body: unknown }>
  ): Promise<BatchSubResponse[]> {
    if (requests.length > this.maxBatchSize) {
      throw new Error(`Batch size ${requests.length} exceeds maximum limit of ${this.maxBatchSize}`);
    }

    const responses = await Promise.all(
      requests.map(async req => {
        try {
          const res = await dispatcher(req);
          return { id: req.id, status: res.status, body: res.body };
        } catch (err: unknown) {
          return { id: req.id, status: 500, body: { error: (err as Error).message } };
        }
      })
    );

    return responses;
  }
}
