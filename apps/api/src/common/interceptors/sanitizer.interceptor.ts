import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SanitizerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    if (request.body) {
      request.body = this.sanitize(request.body);
    }
    if (request.query) {
      request.query = this.sanitize(request.query);
    }
    if (request.params) {
      request.params = this.sanitize(request.params);
    }

    return next.handle();
  }

  private sanitize(input: any): any {
    if (typeof input === 'string') {
      // Strips XSS script tags and basic HTML tags securely
      return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>?/gm, '')
        .trim();
    } else if (Array.isArray(input)) {
      return input.map(item => this.sanitize(item));
    } else if (typeof input === 'object' && input !== null) {
      const sanitizedObj: any = {};
      for (const key of Object.keys(input)) {
        sanitizedObj[key] = this.sanitize(input[key]);
      }
      return sanitizedObj;
    }
    return input;
  }
}
