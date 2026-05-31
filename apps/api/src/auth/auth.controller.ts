import {
  Controller, Post, Body, Get, Patch,
  Req, UseGuards, Res, HttpStatus, Inject, Param,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AppleStrategy } from './apple.strategy.js';

const CLIENT = () => process.env.CLIENT_URL || 'http://localhost:3000';

@Controller('api/v1/auth')
export class AuthController {
  declare private authService: AuthService;
  declare private appleStrategy: AppleStrategy;

  constructor(
    @Inject(AuthService) authService: AuthService,
    @Inject(AppleStrategy) appleStrategy: AppleStrategy,
  ) {
    this.authService = authService;
    this.appleStrategy = appleStrategy;
  }

  // ── Register ──────────────────────────────────────────────────────────────
  @Post('register')
  async register(
    @Body() body: { email: string; username: string; name: string; password?: string },
  ) {
    return this.authService.register(body);
  }

  // ── Email login ────────────────────────────────────────────────────────────
  @Post('login')
  async login(
    @Body() body: { identifier: string; password?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.authService.login(body);
    this.setAuthCookies(res, data.accessToken, data.refreshToken);
    return { user: data.user, accessToken: data.accessToken };
  }

  // ── Google: step 1 — redirect to Google ──────────────────────────────────
  // The AuthGuard handles the redirect internally, no manual passport call needed
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Guard redirects to Google — this body never executes
  }

  // ── Google: step 2 — Google redirects back here ───────────────────────────
  // AuthGuard runs the strategy, attaches req.user, then this handler runs.
  // Because it is NOT async and does NOT call passport manually, there is only
  // ever one response written.
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any, @Res() res: Response) {
    try {
      const data = await this.authService.validateSocialUser(req.user);
      this.setAuthCookies(res, data.accessToken, data.refreshToken);
      return res.redirect(
        `${CLIENT()}/?token=${data.accessToken}&userId=${data.user.id}`,
      );
    } catch (err: any) {
      console.error('[Google Callback] error:', err?.message);
      return res.redirect(`${CLIENT()}/?error=oauth_failed`);
    }
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return { success: true };
  }

  // ── Update current user's profile ─────────────────────────────────────
  @Patch('profile')
  @UseGuards(AuthGuard('jwt'))
  async updateProfile(
    @Req() req: any,
    @Body() body: { name?: string; bio?: string; profilePic?: string },
  ) {
    return this.authService.updateProfile(req.user.id, body);
  }

  // ── Get public profile by username ───────────────────────────────────
  @Get('users/:username')
  async getPublicProfile(@Param('username') username: string) {
    return this.authService.getPublicProfile(username);
  }

  // ── Current user ────────────────────────────────────────────────────────
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getMe(@Req() req: any) {
    return this.authService.getProfile(req.user.id);
  }

  // ── Apple (disabled) ──────────────────────────────────────────────────────
  @Get('apple')
  appleDisabled(@Res() res: Response) {
    return res
      .status(HttpStatus.SERVICE_UNAVAILABLE)
      .json({ message: 'Apple Sign-In is not configured.' });
  }

  @Post('apple/callback')
  appleCallbackDisabled(@Res() res: Response) {
    return res.redirect(`${CLIENT()}/?error=apple_disabled`);
  }

  // ── Cookie helper ─────────────────────────────────────────────────────────
  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure:   isProd,
      sameSite: 'lax',
      maxAge:   7 * 24 * 60 * 60 * 1000,
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure:   isProd,
      sameSite: 'lax',
      maxAge:   7 * 24 * 60 * 60 * 1000,
    });
  }
}
