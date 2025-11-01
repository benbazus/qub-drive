import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database.config';
import {
  User,
  UserPayload,
  AuthTokens,
  TokenPayload,
  LoginCredentials,
  RegisterCredentials,
  Session,
  DeviceInfo,
  RegisterStepOneInput,
  RegisterStepTwoInput,
  RegisterStepThreeInput,
  ForgotPasswordStepTwoInput,
  ForgotPasswordStepThreeInput,
  ForgotPasswordStepOneInput,
} from '../types/auth.types';
import { authConfig } from '../config/auth.config';
import { EmailServiceFactory } from './email/email-service.factory';
import { SystemSettingsService } from './system-settings.service';
import { generateOtpCode, hashPassword } from '../utils/file.utils';
import path from 'path';
import fs from "fs/promises";
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { logger } from '../config/logger';
import { OtpType, UserRole as PrismaUserRole, Permission as PrismaPermission } from '@prisma/client';

const emailService = EmailServiceFactory.create();
const systemSettingsService = new SystemSettingsService();


class AuthService {


  async registerStepOne(input: RegisterStepOneInput): Promise<{ message: string; step: number }> {
    const { email } = input;

    // Check if user already exists and is fully registered
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser && existingUser.registrationStep === 3 && existingUser.passwordHash) {
      throw new Error("User with this email already exists");
    }

    // Generate OTP
    const otpCode = generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Clean up any existing OTP codes for this email
    await prisma.otpCode.deleteMany({
      where: {
        email,
        type: OtpType.REGISTRATION,
      },
    });

    // Create new OTP
    await prisma.otpCode.create({
      data: {
        email,
        code: otpCode,
        type: OtpType.REGISTRATION,
        expiresAt,
      },
    });

    // Create or update user record
    await prisma.user.upsert({
      where: { email },
      update: {
        registrationStep: 1,
      },
      create: {
        email,
        password: "", // Temporary empty password, will be set in step 3
        firstName: "", // Temporary empty firstName, will be set in step 3
        lastName: "", // Temporary empty lastName, will be set in step 3
        registrationStep: 1,
        passwordResetToken: "undefined", // This field is not nullable in the schema, so we provide a default. It will be properly set during password reset.
      },
    });

    console.log("=====================");
    console.log(otpCode);
    console.log("=====================");
    // Send OTP email
    try {
      await emailService.sendOtpEmail(email, otpCode, OtpType.REGISTRATION, expiresAt);
    } catch { }

    return {
      message: "OTP sent to your email address",
      step: 2,
    };
  }

  async registerStepTwo(input: RegisterStepTwoInput): Promise<{ message: string; step: number }> {
    const { email, otp } = input;

    // Find valid OTP
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        email,
        code: otp,
        type: OtpType.REGISTRATION,
        expiresAt: { gt: new Date() },
        isUsed: false,
      },
    });

    if (!otpRecord) {
      throw new Error("Invalid or expired OTP code");
    }

    // Mark OTP as used
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    // Update user registration step
    await prisma.user.update({
      where: { email },
      data: {
        registrationStep: 2,
        isEmailVerified: true,
      },
    });


    return {
      message: "Email verified successfully",
      step: 3,
    };
  }

  async registerStepThree(input: RegisterStepThreeInput) {
    const { email, password, firstName, lastName } = input;

    // 1. Verify the user's current registration state
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // SECURITY: Changed error message to be less specific to prevent email enumeration.
      throw new Error("Invalid registration state. Please start the registration process again.");
    }

    if (user.registrationStep !== 2) {
      throw new Error("Invalid registration step. Please start the registration process again.");
    }

    // 2. Prepare data for the user update
    const settings = await systemSettingsService.getSettings();
    const hashedPassword = await hashPassword(password);

    // SECURITY/ROBUSTNESS: Use the unique, immutable user.id for the folder name instead of the email.
    // This prevents path traversal issues and problems if the user's email ever changes.
    const userStoragePath = path.join(settings.defaultStoragePath, user.id);

    // 3. Create the user's storage directory (Side Effect)
    try {
      // SIMPLIFIED: `mkdir` with `mode` sets permissions. A separate `chmod` is redundant.
      await fs.mkdir(userStoragePath, { recursive: true, mode: 0o755 });
      logger.info(`Created user storage directory: ${userStoragePath}`);
    } catch (error: any) {
      logger.error(`Failed to create storage directory for user ${email}:`, error);
      // Use the custom HttpError for consistent client-side error handling.
      throw new Error(`Could not create storage directory. Please contact support.`);
    }

    // 4. Perform the database transaction
    let updatedUser; // Let TypeScript infer the type from the prisma.user.update result
    try {
      updatedUser = await prisma.$transaction(async (tx: {
        user: {
          update: (arg0: {
            where: { id: any; }; // Use the primary key for the update
            data: {
              passwordHash: string; firstName: string; lastName: string; registrationStep: number; // Final step
              isActive: boolean; storageLimit: bigint; //* 1024 * 1024 * 1024,
              storagePath: string; storageUsed: number;
            };
          }) => any;
        };
      }) => {
        const userUpdate = await tx.user.update({
          where: { id: user.id }, // Use the primary key for the update
          data: {
            passwordHash: hashedPassword,
            firstName,
            lastName,
            registrationStep: 3, // Final step
            isActive: true,
            storageLimit: settings.defaultMaxStorage,//* 1024 * 1024 * 1024,
            storagePath: userStoragePath,
            storageUsed: 0,
          },
        });


        return userUpdate;
      });
    } catch (error) {

      logger.error(`Registration database transaction failed for user ${email}:`, error);

      // If the DB transaction fails, attempt to roll back the file system change.
      try {
        // Use fs.rm which is the modern and recommended way to remove directories.
        await fs.rm(userStoragePath, { recursive: true, force: true });
        logger.warn(`Cleaned up directory due to failed transaction: ${userStoragePath}`);
      } catch (cleanupError) {
        logger.error(`CRITICAL: Failed to clean up directory ${userStoragePath} after a failed transaction. Manual cleanup required.`, cleanupError);
      }

      throw new Error("Failed to complete user registration. Please try again.");
    }

    // 5. Generate tokens and finalize the response
    const tokenPayload = { userId: updatedUser.id, email: updatedUser.email, role: updatedUser.role };
    const accessToken = generateAccessToken(tokenPayload).token;
    const refreshToken = generateRefreshToken(tokenPayload).token;

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: updatedUser.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
    });



    return {
      user: {
        id: updatedUser.id,
        name: `${updatedUser.firstName} ${updatedUser.lastName}`,
        isEmailVerified: updatedUser.isEmailVerified,
        registrationStep: updatedUser.registrationStep,
        isActive: updatedUser.isActive,
        email: updatedUser.email,
        role: updatedUser.role,
      },
      tokens: { accessToken, refreshToken },
    };
  }

  async resendOtp(email: string): Promise<{ message: string }> {
    // Check if user exists and is in registration process
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.registrationStep === 3) {
      throw new Error("No pending registration found for this email");
    }

    // Check rate limiting (allow resend only after 1 minute)
    const recentOtp = await prisma.otpCode.findFirst({
      where: {
        email,
        type: OtpType.REGISTRATION,
        createdAt: { gt: new Date(Date.now() - 60 * 1000) }, // 1 minute ago
      },
    });

    if (recentOtp) {
      throw new Error("Please wait before requesting another OTP");
    }

    // Generate new OTP
    const otpCode = generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Clean up old OTPs
    await prisma.otpCode.deleteMany({
      where: {
        email,
        type: OtpType.REGISTRATION,
      },
    });

    // Create new OTP
    await prisma.otpCode.create({
      data: {
        email,
        code: otpCode,
        type: OtpType.REGISTRATION,
        expiresAt,
      },
    });

    try {
      // Send OTP email
      await emailService.sendOtpEmail(email, otpCode, OtpType.REGISTRATION, expiresAt);
    } catch { }
    return {
      message: "New OTP sent to your email address",
    };
  }

  async forgotPasswordStepOne(input: ForgotPasswordStepOneInput): Promise<{ message: string; step: number }> {
    const { email } = input;

    // Check if user exists and is fully registered
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.registrationStep !== 3) {
      // Don't reveal if email exists for security
      return {
        message: "If this email exists, you will receive a password reset code",
        step: 2,
      };
    }

    // Generate OTP
    const otpCode = generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Clean up any existing password reset OTP codes for this email
    await prisma.otpCode.deleteMany({
      where: {
        email,
        type: OtpType.PASSWORD_RESET,
      },
    });

    // Create new OTP
    await prisma.otpCode.create({
      data: {
        email,
        code: otpCode,
        type: OtpType.PASSWORD_RESET,
        expiresAt,
        userId: user.id,
      },
    });

    try {
      await emailService.sendOtpEmail(email, otpCode, OtpType.PASSWORD_RESET, expiresAt);
    } catch { }

    return {
      message: "Password reset code sent to your email address",
      step: 2,
    };
  }

  async forgotPasswordStepTwo(input: ForgotPasswordStepTwoInput): Promise<{ message: string; step: number }> {
    const { email, otp } = input;

    // Find valid OTP
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        email,
        code: otp,
        type: OtpType.PASSWORD_RESET,
        expiresAt: { gt: new Date() },
        isUsed: false,
      },
    });

    if (!otpRecord) {
      throw new Error("Invalid or expired password reset code");
    }

    // Mark OTP as used (but don't delete yet, we'll need it for step 3 verification)
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    return {
      message: "Password reset code verified successfully",
      step: 3,
    };
  }

  async forgotPasswordStepThree(input: ForgotPasswordStepThreeInput): Promise<{ message: string }> {
    const { email, newPassword } = input;

    // Verify there's a used OTP for this email (within last 10 minutes for security)
    const recentOtpRecord = await prisma.otpCode.findFirst({
      where: {
        email,
        type: OtpType.PASSWORD_RESET,
        isUsed: true,
        createdAt: { gt: new Date(Date.now() - 10 * 60 * 1000) }, // Within last 10 minutes
      },
      orderBy: { createdAt: "desc" },
    });

    if (!recentOtpRecord) {
      throw new Error("Password reset session expired. Please start the process again.");
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and clear reset tokens
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        passwordResetToken: "null",
        passwordResetExpires: null,
      },
    });

    // Clean up all password reset OTP codes for this email
    await prisma.otpCode.deleteMany({
      where: {
        email,
        type: OtpType.PASSWORD_RESET,
      },
    });

    // Invalidate all refresh tokens to force re-login
    await prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    });

    return {
      message: "Password reset successfully. Please login with your new password.",
    };
  }

  async resendPasswordResetOtp(email: string): Promise<{ message: string }> {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.registrationStep !== 3) {
      // Don't reveal if email exists
      return {
        message: "If this email exists, you will receive a new password reset code",
      };
    }

    // Check rate limiting (allow resend only after 1 minute)
    const recentOtp = await prisma.otpCode.findFirst({
      where: {
        email,
        type: OtpType.PASSWORD_RESET,
        createdAt: { gt: new Date(Date.now() - 60 * 1000) }, // 1 minute ago
      },
    });

    if (recentOtp) {
      throw new Error("Please wait before requesting another password reset code");
    }

    // Generate new OTP
    const otpCode = generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Clean up old OTPs
    await prisma.otpCode.deleteMany({
      where: {
        email,
        type: OtpType.PASSWORD_RESET,
      },
    });

    // Create new OTP
    await prisma.otpCode.create({
      data: {
        email,
        code: otpCode,
        type: OtpType.PASSWORD_RESET,
        expiresAt,
        userId: user.id,
      },
    });

    try {
      await emailService.sendOtpEmail(email, otpCode, OtpType.PASSWORD_RESET, expiresAt);
    } catch { }

    return {
      message: "New password reset code sent to your email address",
    };
  }

  async register(credentials: RegisterCredentials, deviceInfo?: DeviceInfo): Promise<{ user: UserPayload; tokens: AuthTokens }> {
    const { email, password, firstName, lastName, acceptTerms } = credentials;

    if (!acceptTerms) {
      throw new Error('Terms and conditions must be accepted');
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, authConfig.bcryptRounds);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        role: PrismaUserRole.USER,
        permissions: [PrismaPermission.USER_READ],
        isActive: true,
        isVerified: false,
        metadata: {
          registeredAt: new Date().toISOString(),
          source: 'registration'
        }
      },
    });

    const tokens = await this.generateTokens(newUser, deviceInfo);
    const decodedToken = jwt.decode(tokens.accessToken) as TokenPayload;
    const userPayload = this.createUserPayload(newUser, decodedToken.exp);


    return { user: userPayload, tokens };
  }

  async login(credentials: LoginCredentials, deviceInfo?: DeviceInfo): Promise<{ user: UserPayload; tokens: AuthTokens }> {
    const { email, password } = credentials;
    const normalizedEmail = email.toLowerCase();


    // Check if account is locked
    const isLocked = await this.isAccountLocked(normalizedEmail);
    if (isLocked) {
      throw new Error('Account is temporarily locked due to too many failed attempts');
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      await this.recordFailedLogin(normalizedEmail, deviceInfo);
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash || user.password);
    if (!isValidPassword) {
      await this.recordFailedLogin(normalizedEmail, deviceInfo);
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Clear login attempts and update last login
    await this.clearLoginAttempts(normalizedEmail);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        updatedAt: new Date()
      }
    });

    const tokens = await this.generateTokens(user, deviceInfo);
    const decodedToken = jwt.decode(tokens.accessToken) as TokenPayload;
    const userPayload = this.createUserPayload(user, decodedToken.exp);


    return { user: userPayload, tokens };
  }

  async refreshToken(refreshToken: string, deviceInfo?: DeviceInfo): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(refreshToken, authConfig.jwtRefreshSecret) as TokenPayload;

      if (decoded.tokenType !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Find session
      const session = await prisma.session.findUnique({
        where: { id: decoded.sessionId },
        include: { user: true }
      });

      if (!session || !session.isActive || session.expiresAt < new Date()) {
        throw new Error('Invalid or expired session');
      }

      if (!session.user.isActive) {
        throw new Error('User not found or inactive');
      }

      // Update session last accessed time
      await prisma.session.update({
        where: { id: session.id },
        data: { lastAccessedAt: new Date() }
      });

      const tokens = await this.generateTokens(session.user, deviceInfo, session.id);

      return tokens;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async logout(accessToken: string, deviceInfo?: DeviceInfo): Promise<void> {
    try {
      const decoded = jwt.decode(accessToken) as TokenPayload;
      if (decoded?.sessionId) {
        // Deactivate session
        await prisma.session.updateMany({
          where: { id: decoded.sessionId },
          data: { isActive: false }
        });
      }


    } catch (error) {
      // Silent fail for logout
    }
  }

  async verifyToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, authConfig.jwtSecret) as TokenPayload;

      if (decoded.tokenType !== 'access') {
        throw new Error('Invalid token type');
      }

      // Verify user is still active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash || user.password);
    if (!isValidPassword) {
      throw new Error('Invalid current password');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, authConfig.bcryptRounds);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword,
        passwordHash: hashedNewPassword,
        updatedAt: new Date()
      }
    });


  }

  async getUserById(userId: string): Promise<UserPayload | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    return user ? this.createUserPayload(user) : null;
  }

  async getUserByEmail(email: string): Promise<UserPayload | null> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    return user ? this.createUserPayload(user) : null;
  }

  async getAllUsers(page = 1, limit = 50): Promise<{ users: UserPayload[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count()
    ]);

    return {
      users: users.map((user: any) => this.createUserPayload(user)),
      total,
      page,
      limit
    };
  }

  async updateUser(userId: string, data: Partial<Omit<User, 'id' | 'password' | 'createdAt' | 'updatedAt'>>): Promise<UserPayload> {
    const { permissions, role, ...otherData } = data;

    const updateData: any = {
      ...otherData,
      updatedAt: new Date()
    };

    if (permissions) {
      updateData.permissions = permissions as unknown as PrismaPermission[];
    }

    if (role) {
      updateData.role = role as unknown as PrismaUserRole;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    return this.createUserPayload(updatedUser);
  }

  async deactivateUser(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false, updatedAt: new Date() }
    });

    // Revoke all sessions for the user
    await this.revokeAllSessions(userId);
  }

  async activateUser(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: true, updatedAt: new Date() }
    });
  }

  async deleteUser(userId: string): Promise<void> {
    await prisma.user.delete({
      where: { id: userId }
    });
  }

  private async generateTokens(user: any, deviceInfo?: DeviceInfo, existingSessionId?: string): Promise<AuthTokens> {
    const sessionId = existingSessionId || uuidv4();

    const accessPayload: Omit<TokenPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      tokenType: 'access',
      sessionId
    };

    const refreshPayload: Omit<TokenPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      tokenType: 'refresh',
      sessionId
    };

    const jwtExpiration = 60 * 60 * 60; // 60 minutes in seconds
    const jwtRefreshExpiration = 7 * 24 * 60 * 60; // 7 days in seconds

    const accessToken = jwt.sign(accessPayload as object, authConfig.jwtSecret, { expiresIn: jwtExpiration });

    const refreshToken = jwt.sign(refreshPayload as object, authConfig.jwtRefreshSecret, { expiresIn: jwtRefreshExpiration });

    if (!existingSessionId) {
      // Create new session
      await prisma.session.create({
        data: {
          id: sessionId,
          userId: user.id,
          refreshToken,
          deviceInfo: deviceInfo || { userAgent: 'unknown', ipAddress: 'unknown' } as any,
          isActive: true,
          expiresAt: new Date(Date.now() + jwtRefreshExpiration * 1000),
          lastAccessedAt: new Date()
        }
      });
    } else {
      // Update existing session
      await prisma.session.update({
        where: { id: sessionId },
        data: {
          refreshToken,
          lastAccessedAt: new Date()
        }
      });
    }

    return {
      accessToken,
      refreshToken,
      expiresIn: jwtExpiration,
      tokenType: 'Bearer'
    };
  }

  private createUserPayload(user: any, exp?: number): UserPayload {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: user.permissions,
      isActive: user.isActive,
      isVerified: user.isVerified,
      iat: Math.floor(Date.now() / 1000),
      exp: exp || Math.floor(Date.now() / 1000) + (15 * 60) // Default to 15 minutes if exp is not provided
    };
  }

  private async isAccountLocked(email: string): Promise<boolean> {
    const attempt = await prisma.loginAttempt.findUnique({
      where: { email }
    });

    if (!attempt) return false;

    return attempt.lockedUntil ? attempt.lockedUntil > new Date() : false;
  }

  private async recordFailedLogin(email: string, deviceInfo?: DeviceInfo): Promise<void> {
    const attempt = await prisma.loginAttempt.upsert({
      where: { email },
      update: {
        count: { increment: 1 },
        lastAttempt: new Date()
      },
      create: {
        email,
        count: 1,
        lastAttempt: new Date()
      }
    });

    if (attempt.count >= authConfig.maxLoginAttempts) {
      await prisma.loginAttempt.update({
        where: { email },
        data: {
          lockedUntil: new Date(Date.now() + authConfig.lockoutDuration)
        }
      });
    }

  }

  private async clearLoginAttempts(email: string): Promise<void> {
    await prisma.loginAttempt.deleteMany({
      where: { email }
    });
  }




  async getActiveSessions(userId: string): Promise<Session[]> {
    const sessions = await prisma.session.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() }
      },
      orderBy: { lastAccessedAt: 'desc' }
    });

    return sessions.map((session: { id: any; userId: any; refreshToken: any; deviceInfo: any; isActive: any; expiresAt: any; createdAt: any; lastAccessedAt: any; }) => ({
      id: session.id,
      userId: session.userId,
      refreshToken: session.refreshToken,
      deviceInfo: session.deviceInfo as any as DeviceInfo,
      isActive: session.isActive,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      lastAccessedAt: session.lastAccessedAt
    }));
  }

  async revokeSession(sessionId: string): Promise<void> {
    await prisma.session.updateMany({
      where: { id: sessionId },
      data: { isActive: false }
    });
  }

  async revokeAllSessions(userId: string): Promise<void> {
    await prisma.session.updateMany({
      where: { userId },
      data: { isActive: false }
    });
  }

  async getUserStats(): Promise<any> {
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      unverifiedUsers,
      usersByRole,
      recentRegistrations
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } }),
      prisma.user.count({ where: { isVerified: false } }),
      prisma.user.groupBy({
        by: ['role'],
        _count: { id: true }
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
        }
      })
    ]);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      unverifiedUsers,
      usersByRole: usersByRole.reduce((acc: any, role: { role: any; _count: { id: any; }; }) => ({
        ...acc,
        [role.role]: role._count.id
      }), {}),
      recentRegistrations: {
        thisMonth: recentRegistrations
      }
    };
  }
}

const authService = new AuthService();
export default authService;