import { Module } from '@nestjs/common';
import { ModerationController } from './moderation.controller.js';
import { ModerationService } from './moderation.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [ModerationController],
  providers: [ModerationService],
  exports: [ModerationService],
})
export class ModerationModule {}
