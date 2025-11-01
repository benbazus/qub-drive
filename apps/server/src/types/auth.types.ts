export interface User {
  id: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}
export interface RegisterStepOneInput {
  email: string;
}

export interface RegisterStepTwoInput {
  email: string;
  otp: string;
}

export interface RegisterStepThreeInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface ForgotPasswordStepOneInput {
  email: string;
}

export interface ForgotPasswordStepTwoInput {
  email: string;
  otp: string;
}

export interface ForgotPasswordStepThreeInput {
  email: string;
  newPassword: string;
}
export interface UserPayload {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
  isVerified: boolean;
  iat: number;
  exp: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  tokenType: 'access' | 'refresh';
  sessionId: string;
  iat: number;
  exp: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  deviceInfo?: DeviceInfo;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  confirmPassword?: string;
  acceptTerms: boolean;
}

// 3-Step Registration Types
export interface StartRegistrationRequest {
  email: string;
}

export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

export interface CompleteRegistrationRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  acceptTerms: boolean;
}

// OTP Types
export interface GenerateOtpRequest {
  email: string;
  type: 'email_verification' | 'password_reset' | 'login_verification';
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
  type: 'email_verification' | 'password_reset' | 'login_verification';
}

export interface ResendOtpRequest {
  email: string;
  type: 'email_verification' | 'password_reset' | 'login_verification';
}

export interface RefreshTokenRequest {
  refreshToken: string;
  deviceInfo?: DeviceInfo;
}

export interface DeviceInfo {
  userAgent: string;
  ipAddress: string;
  deviceId?: string;
  platform?: string;
}

export interface Session {
  id: string;
  userId: string;
  refreshToken: string;
  deviceInfo: DeviceInfo;
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
  lastAccessedAt: Date;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordReset {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordWithOtpRequest {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
  GUEST = 'guest'
}

export enum Permission {
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_MANAGE_ROLES = 'user:manage_roles',
  FILE_CREATE = 'file:create',
  FILE_READ = 'file:read',
  FILE_UPDATE = 'file:update',
  FILE_DELETE = 'file:delete',
  FILE_SHARE = 'file:share',
  FILE_UPLOAD = 'file:upload',
  SYSTEM_SETTINGS_READ = 'system:settings:read',
  SYSTEM_SETTINGS_UPDATE = 'system:settings:update',
  SYSTEM_SETTINGS_RESET = 'system:settings:reset',
  SYSTEM_INFO_READ = 'system:info:read',
  ADMIN_ACCESS = 'admin:access',
  SYSTEM_CONFIG = 'system:config',
  AUDIT_VIEW = 'audit:view',
  REPORTS_VIEW = 'reports:view',
  REPORTS_CREATE = 'reports:create'
}

export interface AuthServiceConfig {
  jwtSecret: string;
  jwtRefreshSecret: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
  bcryptRounds: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  sessionTimeout: number;
}

export interface RateLimitConfig {
  windowMs: number;
  maxAttempts: number;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
}

export interface SecurityEvent {
  type: 'login' | 'logout' | 'password_change' | 'failed_login' | 'account_locked' | 'token_refresh';
  userId?: string;
  email?: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  metadata?: Record<string, any>;
  timestamp: Date;
}