import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module.js';
import { PostsModule } from './posts/posts.module.js';
import { SocialModule } from './social/social.module.js';
import { GatewayModule } from './gateway/gateway.module.js';
import { WorkerModule } from './worker/worker.module.js';
import { ModerationModule } from './moderation/moderation.module.js';
import { SanitizerInterceptor } from './common/interceptors/sanitizer.interceptor.js';

@Module({
  imports: [
    // Rate Limiting: Max 120 requests per minute per IP
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 120,
    }]),
    AuthModule,
    PostsModule,
    SocialModule,
    GatewayModule,
    WorkerModule,
    ModerationModule,
  ],
  providers: [
    // Bind Global Rate Limiting Guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Bind Global XSS Sanitizer Interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: SanitizerInterceptor,
    }
  ]
})
export class AppModule {}
