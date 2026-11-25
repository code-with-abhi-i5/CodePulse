/**
 * Architecture Service: gRPC Error Mapping Interceptor
 * Subsystem: Error Translation & Interoperability
 */

export const GrpcStatus = {
  OK: 0,
  CANCELLED: 1,
  UNKNOWN: 2,
  INVALID_ARGUMENT: 3,
  DEADLINE_EXCEEDED: 4,
  NOT_FOUND: 5,
  ALREADY_EXISTS: 6,
  PERMISSION_DENIED: 7,
  RESOURCE_EXHAUSTED: 8,
  FAILED_PRECONDITION: 9,
  UNAUTHENTICATED: 16
};
export type GrpcStatus = typeof GrpcStatus[keyof typeof GrpcStatus];

export class GrpcErrorMappingInterceptorService {
  public mapHttpToGrpc(httpStatus: number): GrpcStatus {
    switch (httpStatus) {
      case 400: return GrpcStatus.INVALID_ARGUMENT;
      case 401: return GrpcStatus.UNAUTHENTICATED;
      case 403: return GrpcStatus.PERMISSION_DENIED;
      case 404: return GrpcStatus.NOT_FOUND;
      case 408: return GrpcStatus.DEADLINE_EXCEEDED;
      case 409: return GrpcStatus.ALREADY_EXISTS;
      case 429: return GrpcStatus.RESOURCE_EXHAUSTED;
      default: return GrpcStatus.UNKNOWN;
    }
  }
}
