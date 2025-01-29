import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, { error: string | null; data: T | null }> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<{ error: string | null; data: T | null }> {
    return next.handle().pipe(
      map((data) => ({
        error: null,
        data,
      }))
    );
  }
}
