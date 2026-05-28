import {
  Injectable, UnauthorizedException, BadRequestException,
  ConflictException, NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { v4 as uuid } from 'uuid';
import { User, UserDocument } from '../../database/schemas/user.schema';
import { Organization, OrganizationDocument } from '../../database/schemas/organization.schema';
import { slugify } from '@solartech/shared';
import type { LoginDto, RegisterDto, VerifyMfaDto, ResetPasswordDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)       private userModel: Model<UserDocument>,
    @InjectModel(Organization.name) private orgModel: Model<OrganizationDocument>,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  // ─── Register ──────────────────────────────────────────────────────────────
  async register(dto: RegisterDto) {
    const exists = await this.userModel.findOne({ email: dto.email.toLowerCase() });
    if (exists) throw new ConflictException('Email already registered');

    const hash = await bcrypt.hash(dto.password, 12);

    let organizationId: string | undefined;
    if (dto.organizationName && (dto.role === 'installer' || dto.role === 'solar_company')) {
      const org = await this.orgModel.create({
        name: dto.organizationName,
        slug: slugify(dto.organizationName) + '-' + Date.now().toString(36),
        plan: 'starter',
      });
      organizationId = org._id.toString();
    }

    const user = await this.userModel.create({
      email:          dto.email.toLowerCase(),
      password:       hash,
      firstName:      dto.firstName,
      lastName:       dto.lastName,
      role:           dto.role ?? 'client',
      organizationId: organizationId ? new Types.ObjectId(organizationId) : undefined,
      emailVerificationToken: uuid(),
    });

    const tokens = await this.generateTokens(user);
    await this.saveRefreshToken(user._id.toString(), tokens.refreshToken);

    return { user: this.sanitizeUser(user), tokens };
  }

  // ─── Login ─────────────────────────────────────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.userModel
      .findOne({ email: dto.email.toLowerCase() })
      .select('+password +mfaSecret +isMfaEnabled');

    if (!user || !(await bcrypt.compare(dto.password, user.password ?? ''))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!user.isActive) throw new UnauthorizedException('Account suspended');

    // MFA check
    if (user.isMfaEnabled) {
      if (!dto.mfaCode) {
        const sessionToken = this.jwtService.sign(
          { sub: user._id.toString(), type: 'mfa_session' },
          { secret: this.config.get('app.jwt.accessSecret'), expiresIn: '5m' },
        );
        return { requiresMfa: true, mfaSessionToken: sessionToken };
      }
      const valid = speakeasy.totp.verify({
        secret: user.mfaSecret!,
        encoding: 'base32',
        token: dto.mfaCode,
        window: 1,
      });
      if (!valid) throw new UnauthorizedException('Invalid MFA code');
    }

    const tokens = await this.generateTokens(user);
    await this.saveRefreshToken(user._id.toString(), tokens.refreshToken);
    await this.userModel.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

    return { user: this.sanitizeUser(user), tokens };
  }

  // ─── Verify MFA ────────────────────────────────────────────────────────────
  async verifyMfa(dto: VerifyMfaDto) {
    let payload: { sub: string; type: string };
    try {
      payload = this.jwtService.verify(dto.sessionToken, {
        secret: this.config.get('app.jwt.accessSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired session');
    }
    if (payload.type !== 'mfa_session') throw new UnauthorizedException();

    const user = await this.userModel.findById(payload.sub).select('+mfaSecret');
    if (!user) throw new NotFoundException('User not found');

    const valid = speakeasy.totp.verify({
      secret: user.mfaSecret!,
      encoding: 'base32',
      token: dto.code,
      window: 1,
    });
    if (!valid) throw new UnauthorizedException('Invalid MFA code');

    const tokens = await this.generateTokens(user);
    await this.saveRefreshToken(user._id.toString(), tokens.refreshToken);

    return { user: this.sanitizeUser(user), tokens };
  }

  // ─── MFA Setup ─────────────────────────────────────────────────────────────
  async setupMfa(userId: string) {
    const secret = speakeasy.generateSecret({ name: 'SolarTech', issuer: 'SolarTech' });
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);
    const backupCodes = Array.from({ length: 8 }, () => uuid().split('-')[0].toUpperCase());

    await this.userModel.findByIdAndUpdate(userId, {
      mfaSecret: secret.base32,
      mfaBackupCodes: backupCodes,
    });

    return { secret: secret.base32, qrCodeUrl, backupCodes };
  }

  async confirmMfa(userId: string, code: string) {
    const user = await this.userModel.findById(userId).select('+mfaSecret');
    if (!user?.mfaSecret) throw new BadRequestException('MFA not configured');

    const valid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });
    if (!valid) throw new UnauthorizedException('Invalid code');

    await this.userModel.findByIdAndUpdate(userId, { isMfaEnabled: true });
    return { enabled: true };
  }

  // ─── Refresh Token ─────────────────────────────────────────────────────────
  async refreshTokens(refreshToken: string) {
    let payload: { sub: string; type: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get('app.jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userModel.findById(payload.sub).select('+refreshToken');
    if (!user?.refreshToken) throw new UnauthorizedException();

    const matches = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!matches) throw new UnauthorizedException('Refresh token mismatch');

    const tokens = await this.generateTokens(user);
    await this.saveRefreshToken(user._id.toString(), tokens.refreshToken);
    return tokens;
  }

  // ─── Forgot / Reset Password ───────────────────────────────────────────────
  async forgotPassword(email: string) {
    const user = await this.userModel.findOne({ email: email.toLowerCase() });
    if (!user) return; // silently succeed

    const token = uuid();
    const expiry = new Date(Date.now() + 3600_000); // 1 hour
    await this.userModel.findByIdAndUpdate(user._id, {
      passwordResetToken: await bcrypt.hash(token, 8),
      passwordResetExpiry: expiry,
    });

    // TODO: send email via NotificationsService
    console.log(`Reset token for ${email}: ${token}`);
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.userModel
      .findOne({ passwordResetExpiry: { $gt: new Date() } })
      .select('+passwordResetToken +passwordResetExpiry');

    if (!user?.passwordResetToken) throw new BadRequestException('Invalid or expired reset token');

    const valid = await bcrypt.compare(dto.token, user.passwordResetToken);
    if (!valid) throw new BadRequestException('Invalid reset token');

    await this.userModel.findByIdAndUpdate(user._id, {
      password: await bcrypt.hash(dto.newPassword, 12),
      passwordResetToken:  null,
      passwordResetExpiry: null,
    });
  }

  // ─── OAuth ─────────────────────────────────────────────────────────────────
  async handleOAuthLogin(profile: {
    provider: string;
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  }) {
    const providerKey = `${profile.provider}Id` as 'googleId' | 'githubId';

    let user = await this.userModel.findOne({
      $or: [{ [providerKey]: profile.id }, { email: profile.email }],
    });

    if (!user) {
      user = await this.userModel.create({
        email:          profile.email.toLowerCase(),
        firstName:      profile.firstName,
        lastName:       profile.lastName,
        avatarUrl:      profile.avatarUrl,
        role:           'client',
        isEmailVerified: true,
        [providerKey]:  profile.id,
      });
    } else if (!user[providerKey]) {
      await this.userModel.findByIdAndUpdate(user._id, { [providerKey]: profile.id });
    }

    const tokens = await this.generateTokens(user);
    await this.saveRefreshToken(user._id.toString(), tokens.refreshToken);
    return { user: this.sanitizeUser(user), tokens };
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────
  async getMe(userId: string) {
    const user = await this.userModel.findById(userId).populate('organizationId');
    if (!user) throw new NotFoundException('User not found');
    return this.sanitizeUser(user);
  }

  private async generateTokens(user: UserDocument) {
    const payload = {
      sub:            user._id.toString(),
      email:          user.email,
      role:           user.role,
      organizationId: user.organizationId?.toString(),
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret:    this.config.get('app.jwt.accessSecret'),
        expiresIn: this.config.get('app.jwt.accessExpiry'),
      }),
      this.jwtService.signAsync(payload, {
        secret:    this.config.get('app.jwt.refreshSecret'),
        expiresIn: this.config.get('app.jwt.refreshExpiry'),
      }),
    ]);

    return { accessToken, refreshToken, expiresIn: 900 };
  }

  private async saveRefreshToken(userId: string, refreshToken: string) {
    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.userModel.findByIdAndUpdate(userId, { refreshToken: hashed });
  }

  private sanitizeUser(user: UserDocument) {
    const obj = user.toObject({ virtuals: true });
    delete obj.password;
    delete obj.refreshToken;
    delete obj.mfaSecret;
    delete obj.mfaBackupCodes;
    delete obj.passwordResetToken;
    delete obj.passwordResetExpiry;
    delete obj.emailVerificationToken;
    return {
      ...obj,
      id: obj._id?.toString(),
      _id: obj._id?.toString(),
      organizationId: obj.organizationId?.toString(),
    };
  }
}
