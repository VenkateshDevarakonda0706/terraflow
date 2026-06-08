import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  override handleRequest(err: any, user: any, info: any) {
    // No token provided → anonymous access allowed
    if (!err && !user && !info) {
      return null;
    }

    // Token was provided but expired
    if (info?.name === 'TokenExpiredError') {
      throw new UnauthorizedException('Token expired');
    }

    // Token was provided but invalid
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid token');
    }

    return user;
  }
}
