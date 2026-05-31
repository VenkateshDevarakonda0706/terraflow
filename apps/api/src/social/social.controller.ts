import { Controller, Post, Get, Body, Param, Req, UseGuards, Inject } from '@nestjs/common';
import { SocialService } from './social.service.js';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/v1/social')
export class SocialController {
  declare private socialService: SocialService;

  constructor(@Inject(SocialService) socialService: SocialService) {
    this.socialService = socialService;
  }

  @Post('follow/:userId')
  @UseGuards(AuthGuard('jwt'))
  async follow(
    @Req() req: any,
    @Param('userId') followingId: string
  ) {
    return this.socialService.followUser(req.user.id, followingId);
  }

  @Post('like/:postId')
  @UseGuards(AuthGuard('jwt'))
  async like(
    @Req() req: any,
    @Param('postId') postId: string
  ) {
    return this.socialService.likePost(req.user.id, postId);
  }

  @Post('save/:postId')
  @UseGuards(AuthGuard('jwt'))
  async save(
    @Req() req: any,
    @Param('postId') postId: string
  ) {
    return this.socialService.savePost(req.user.id, postId);
  }

  @Post('comment/:postId')
  @UseGuards(AuthGuard('jwt'))
  async comment(
    @Req() req: any,
    @Param('postId') postId: string,
    @Body('content') content: string
  ) {
    return this.socialService.addComment(req.user.id, postId, content);
  }

  @Get('comment/:postId')
  async getComments(
    @Param('postId') postId: string
  ) {
    return this.socialService.getComments(postId);
  }
}
