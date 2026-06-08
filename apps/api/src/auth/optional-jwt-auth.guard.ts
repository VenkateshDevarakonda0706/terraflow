import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  override handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    
    const authHeader = request.headers['authorization'];
    const hasBearer = authHeader?.startsWith('Bearer ');
    const hasCookie = request.cookies?.accessToken;

    // If no token was provided, allow the request to proceed as anonymous.
    if (!hasBearer && !hasCookie) {
      return null;
    }

    // If credentials were provided but are invalid, reject the request.
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid token');
    }

    return user;
  }
}
