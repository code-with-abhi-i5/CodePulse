import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data: T;
  meta?: any;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        // If data already matches the expected structure, return as is
        if (data && typeof data === 'object' && ('data' in data || 'meta' in data) && 'success' in data) {
           return {
             ...data,
             timestamp: new Date().toISOString(),
           };
        }

        // Otherwise wrap it
        return {
          success: true,
          data: data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
