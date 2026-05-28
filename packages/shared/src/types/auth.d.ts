export interface LoginRequest {
    email: string;
    password: string;
    mfaCode?: string;
}
export interface RegisterRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: 'client' | 'installer' | 'solar_company';
    organizationName?: string;
    inviteToken?: string;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export interface AuthResponse {
    user: import('./user').User;
    tokens: AuthTokens;
    requiresMfa?: boolean;
    mfaSessionToken?: string;
}
export interface RefreshTokenRequest {
    refreshToken: string;
}
export interface MfaSetupResponse {
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
}
export interface VerifyMfaRequest {
    code: string;
    sessionToken: string;
}
export interface ForgotPasswordRequest {
    email: string;
}
export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
}
export interface JwtPayload {
    sub: string;
    email: string;
    role: import('./user').UserRole;
    organizationId?: string;
    iat: number;
    exp: number;
}
