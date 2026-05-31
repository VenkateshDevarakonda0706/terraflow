import { Module } from '@nestjs/common';
import { SocialController } from './social.controller.js';
import { SocialService } from './social.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { GatewayModule } from '../gateway/gateway.module.js';

@Module({
  imports: [AuthModule, GatewayModule],
  controllers: [SocialController],
  providers: [SocialService],
  exports: [SocialService],
})
export class SocialModule {}
