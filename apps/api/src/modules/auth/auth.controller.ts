import {
  Controller, Post, Get, Body, UseGuards, Req,
  HttpCode, HttpStatus, Res, Version,
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
  @Get('oauth/google')
  @ApiOperation({ summary: 'Initiate Google OAuth flow' })
  googleOAuth(@Res() res: Response) {
    const clientId  = this.config.get('app.oauth.googleClientId');
    const callback  = this.config.get('app.oauth.googleCallbackUrl');
    const scope     = 'openid email profile';
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${callback}&response_type=code&scope=${encodeURIComponent(scope)}`;
    res.redirect(url);
  }
}
