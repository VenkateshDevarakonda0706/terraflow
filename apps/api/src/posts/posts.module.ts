import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller.js';
import { PostsService } from './posts.service.js';
import { StorageService } from './storage.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [PostsController],
  providers: [PostsService, StorageService],
  exports: [PostsService, StorageService],
})
export class PostsModule {}
