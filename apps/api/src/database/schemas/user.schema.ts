import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import type { UserRole } from '@solartech/shared';

export type UserDocument = User & Document;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, index: true })
  email: string;

  @Prop({ select: false })
  password?: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({
    type: String,
    enum: ['super_admin','solar_company','installer','technician','client','lgu_officer','finance_officer','investor'],
    default: 'client',
  })
  role: UserRole;

  @Prop({ type: Types.ObjectId, ref: 'Organization', index: true })
  organizationId?: Types.ObjectId;

  @Prop()
  avatarUrl?: string;

  @Prop()
  phone?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ default: false })
  isMfaEnabled: boolean;

  @Prop({ select: false })
  mfaSecret?: string;

  @Prop({ type: [String], select: false })
  mfaBackupCodes?: string[];

  @Prop({ select: false })
  refreshToken?: string;

  @Prop({ select: false })
  passwordResetToken?: string;

  @Prop({ select: false })
  passwordResetExpiry?: Date;

  @Prop({ select: false })
  emailVerificationToken?: string;

  // OAuth providers
  @Prop()
  googleId?: string;

  @Prop()
  githubId?: string;

  @Prop()
  lastLoginAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});
