import {
  Controller, Post, Get, Body, UseGuards, Req,
  HttpCode, HttpStatus, Res, Version, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Throttle } from '@nestjs/throttler';
import {
  LoginDto, RegisterDto, RefreshTokenDto, ForgotPasswordDto,
  ResetPasswordDto, VerifyMfaDto, EnableMfaDto,
} from './dto/auth.dto';
import { ConfigService } from '@nestjs/config';

@ApiTags('Authentication')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private authService: AuthService,
    private config: ConfigService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Login with email/password' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('verify-mfa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete MFA verification' })
  async verifyMfa(@Body() dto: VerifyMfaDto) {
    return this.authService.verifyMfa(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 3, ttl: 300000 } })
  @ApiOperation({ summary: 'Send password reset email' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return { message: 'If the email exists, a reset link has been sent.' };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto);
    return { message: 'Password reset successfully.' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  async getMe(@CurrentUser() user: { sub: string }) {
    return this.authService.getMe(user.sub);
  }

  // ─── MFA Management ────────────────────────────────────────────────────────
  @Post('mfa/setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initialize MFA setup — returns QR code' })
  async setupMfa(@CurrentUser() user: { sub: string }) {
    return this.authService.setupMfa(user.sub);
  }

  @Post('mfa/enable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm and enable MFA' })
  async enableMfa(@CurrentUser() user: { sub: string }, @Body() dto: EnableMfaDto) {
    return this.authService.confirmMfa(user.sub, dto.code);
  }

  // ─── OAuth ─────────────────────────────────────────────────────────────────
  private frontendUrl(): string {
    return this.config.get<string>('app.frontendUrl') ?? 'http://localhost:3000';
  }

  private redirectOAuthSuccess(res: Response, oauthSession: unknown) {
    const payload = Buffer.from(JSON.stringify(oauthSession)).toString('base64url');
    res.redirect(`${this.frontendUrl()}/oauth/callback?payload=${encodeURIComponent(payload)}`);
  }

  private redirectOAuthError(res: Response, code: string) {
    res.redirect(`${this.frontendUrl()}/login?error=${code}`);
  }

  @Get('oauth/google')
  @ApiOperation({ summary: 'Initiate Google OAuth flow' })
  googleOAuth(@Res() res: Response) {
    const clientId  = this.config.get<string>('app.oauth.googleClientId');
    const callback  = this.config.get<string>('app.oauth.googleCallbackUrl');
    if (!clientId || !callback) {
      this.redirectOAuthError(res, 'oauth_not_configured');
      return;
    }
    const scope = 'openid email profile';
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(callback)}&response_type=code&scope=${encodeURIComponent(scope)}`;
    res.redirect(url);
  }

  @Get('oauth/google/callback')
  @ApiOperation({ summary: 'Handle Google OAuth callback' })
  async googleOAuthCallback(
    @Query('code') code?: string,
    @Query('error') error?: string,
    @Res() res?: Response,
  ) {
    if (!res) return;
    if (error) {
      this.redirectOAuthError(res, 'oauth_denied');
      return;
    }
    if (!code) {
      this.redirectOAuthError(res, 'oauth_missing_code');
      return;
    }

    try {
      const clientId = this.config.get<string>('app.oauth.googleClientId');
      const clientSecret = this.config.get<string>('app.oauth.googleClientSecret');
      const callback = this.config.get<string>('app.oauth.googleCallbackUrl');
      if (!clientId || !clientSecret || !callback) {
        this.redirectOAuthError(res, 'oauth_not_configured');
        return;
      }

      const tokenBody = new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callback,
        grant_type: 'authorization_code',
      });

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenBody.toString(),
      });
      if (!tokenResponse.ok) {
        this.redirectOAuthError(res, 'oauth_token_exchange_failed');
        return;
      }
      const tokenData = await tokenResponse.json() as { access_token?: string };
      if (!tokenData.access_token) {
        this.redirectOAuthError(res, 'oauth_token_missing');
        return;
      }

      const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      if (!profileResponse.ok) {
        this.redirectOAuthError(res, 'oauth_profile_failed');
        return;
      }
      const profile = await profileResponse.json() as {
        id?: string;
        email?: string;
        given_name?: string;
        family_name?: string;
        name?: string;
        picture?: string;
      };
      if (!profile.id || !profile.email) {
        this.redirectOAuthError(res, 'oauth_profile_incomplete');
        return;
      }

      const [firstNameFromName = '', ...rest] = (profile.name ?? '').split(' ').filter(Boolean);
      const oauthSession = await this.authService.handleOAuthLogin({
        provider: 'google',
        id: profile.id,
        email: profile.email,
        firstName: profile.given_name ?? firstNameFromName ?? '',
        lastName: profile.family_name ?? rest.join(' ') ?? '',
        avatarUrl: profile.picture,
      });

      this.redirectOAuthSuccess(res, oauthSession);
    } catch {
      this.redirectOAuthError(res, 'oauth_callback_failed');
    }
  }

  @Get('oauth/github')
  @ApiOperation({ summary: 'Initiate GitHub OAuth flow' })
  githubOAuth(@Res() res: Response) {
    const clientId = this.config.get<string>('app.oauth.githubClientId');
    const callback = this.config.get<string>('app.oauth.githubCallbackUrl');
    if (!clientId || !callback) {
      this.redirectOAuthError(res, 'oauth_not_configured');
      return;
    }
    const scope = 'user:email';
    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(callback)}&scope=${encodeURIComponent(scope)}`;
    res.redirect(url);
  }

  @Get('oauth/github/callback')
  @ApiOperation({ summary: 'Handle GitHub OAuth callback' })
  async githubOAuthCallback(
    @Query('code') code?: string,
    @Query('error') error?: string,
    @Res() res?: Response,
  ) {
    if (!res) return;
    if (error) {
      this.redirectOAuthError(res, 'oauth_denied');
      return;
    }
    if (!code) {
      this.redirectOAuthError(res, 'oauth_missing_code');
      return;
    }

    try {
      const clientId = this.config.get<string>('app.oauth.githubClientId');
      const clientSecret = this.config.get<string>('app.oauth.githubClientSecret');
      const callback = this.config.get<string>('app.oauth.githubCallbackUrl');
      if (!clientId || !clientSecret || !callback) {
        this.redirectOAuthError(res, 'oauth_not_configured');
        return;
      }

      const tokenBody = new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callback,
      });

      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: tokenBody.toString(),
      });
      if (!tokenResponse.ok) {
        this.redirectOAuthError(res, 'oauth_token_exchange_failed');
        return;
      }
      const tokenData = await tokenResponse.json() as { access_token?: string };
      if (!tokenData.access_token) {
        this.redirectOAuthError(res, 'oauth_token_missing');
        return;
      }

      const authHeaders = {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'SolarTech-OAuth',
      };

      const profileResponse = await fetch('https://api.github.com/user', { headers: authHeaders });
      if (!profileResponse.ok) {
        this.redirectOAuthError(res, 'oauth_profile_failed');
        return;
      }
      const profile = await profileResponse.json() as {
        id?: number;
        login?: string;
        name?: string | null;
        email?: string | null;
        avatar_url?: string;
      };
      if (!profile.id) {
        this.redirectOAuthError(res, 'oauth_profile_incomplete');
        return;
      }

      let email = profile.email ?? '';
      if (!email) {
        const emailsResponse = await fetch('https://api.github.com/user/emails', { headers: authHeaders });
        if (emailsResponse.ok) {
          const emails = await emailsResponse.json() as Array<{
            email: string;
            primary?: boolean;
            verified?: boolean;
          }>;
          const primary = emails.find((e) => e.primary && e.verified) ?? emails.find((e) => e.verified) ?? emails[0];
          email = primary?.email ?? '';
        }
      }
      if (!email) {
        this.redirectOAuthError(res, 'oauth_profile_incomplete');
        return;
      }

      const [firstNameFromName = '', ...rest] = (profile.name ?? profile.login ?? '').split(' ').filter(Boolean);
      const oauthSession = await this.authService.handleOAuthLogin({
        provider: 'github',
        id: String(profile.id),
        email,
        firstName: firstNameFromName || profile.login || 'GitHub',
        lastName: rest.join(' ') || 'User',
        avatarUrl: profile.avatar_url,
      });

      this.redirectOAuthSuccess(res, oauthSession);
    } catch {
      this.redirectOAuthError(res, 'oauth_callback_failed');
    }
  }
}
