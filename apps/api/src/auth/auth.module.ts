import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './jwt.strategy.js';
import { GoogleStrategy } from './google.strategy.js';
import { AppleStrategy } from './apple.strategy.js';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard.js';
import { RolesGuard } from './roles.guard.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, AppleStrategy, OptionalJwtAuthGuard, RolesGuard],
  exports: [AuthService, JwtStrategy, GoogleStrategy, AppleStrategy, PassportModule, OptionalJwtAuthGuard, RolesGuard],
})
export class AuthModule {}

