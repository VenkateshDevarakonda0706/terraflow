import {
  Controller, Post, Body, Get, Delete, Param, Query,
  Req, UseGuards, UseInterceptors, UploadedFile, Inject,
} from '@nestjs/common';
import { PostsService } from './posts.service.js';
import { StorageService } from './storage.service.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard.js';
import { CreatePostDto } from './create-post.dto.js';
import { ExploreQueryDto } from './explore.query.dto.js';

@Controller('api/v1/posts')
export class PostsController {
  declare private postsService: PostsService;
  declare private storageService: StorageService;

  constructor(
    @Inject(PostsService) postsService: PostsService,
    @Inject(StorageService) storageService: StorageService,
  ) {
    this.postsService = postsService;
    this.storageService = storageService;
  }

  // ── Upload media file ─────────────────────────────────────────────────────
  @Post('upload')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(@UploadedFile() file: any) {
    if (!file) return { success: false, message: 'No file provided.' };
    const url = await this.storageService.uploadFile(file);
    const coordinates = await this.storageService.extractExifGPS(file.buffer);
    return { success: true, url, coordinates };
  }

  // ── Create post ───────────────────────────────────────────────────────────
  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Req() req: any, @Body() body: CreatePostDto) {
    return this.postsService.createPost(req.user.id, {
      ...body,
      tags: body.tags || [],
      mediaUrls: body.mediaUrls || [],
    });
  }

  // ── Search posts (title / tag) ────────────────────────────────────────────
  @Get('search')
  @UseGuards(OptionalJwtAuthGuard)
  async search(
    @Req() req: any,
    @Query('q') q?: string,
    @Query('tag') tag?: string,
    @Query('page') page?: string,
  ) {
    const requestingUserId = req.user?.id;
    return this.postsService.searchPosts({ q, tag, requestingUserId, page: Number(page || 1) });
  }

  // ── Explore (globe viewport + H3 clustering) ──────────────────────────────
  @Get('explore')
  @UseGuards(OptionalJwtAuthGuard)
  async explore(@Req() req: any, @Query() query: ExploreQueryDto) {
    const requestingUserId = req.user?.id;
    return this.postsService.explore({
      minLat: Number(query.minLat),
      maxLat: Number(query.maxLat),
      minLng: Number(query.minLng),
      maxLng: Number(query.maxLng),
      zoomLevel: Number(query.zoom || 2),
      category: query.category,
      requestingUserId,
      page: Number(query.page || 1),
    });
  }

  // ── Timeline ──────────────────────────────────────────────────────────────
  @Get('timeline')
  @UseGuards(OptionalJwtAuthGuard)
  async getTimeline(
    @Req() req: any,
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius?: number,
  ) {
    const requestingUserId = req.user?.id;
    return this.postsService.getTimeline(
      Number(lat), Number(lng), Number(radius || 5), requestingUserId,
    );
  }

  // ── Get single post ───────────────────────────────────────────────────────
  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async getOne(@Req() req: any, @Param('id') id: string) {
    const requestingUserId = req.user?.id;
    return this.postsService.findById(id, requestingUserId);
  }

  // ── Delete post (authenticated, owner only) ───────────────────────────────
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async deleteOne(@Req() req: any, @Param('id') id: string) {
    return this.postsService.deletePost(id, req.user.id);
  }

  // ── Report post (authenticated) ───────────────────────────────────────────
  @Post(':id/report')
  @UseGuards(AuthGuard('jwt'))
  async report(
    @Req() req: any,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.postsService.reportPost(id, req.user.id, reason);
  }
}
