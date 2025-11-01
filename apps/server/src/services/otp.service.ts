
import { OtpType } from '@prisma/client';
import { EmailService } from './email.service';
import prisma from '@/config/database.config';


export interface OtpConfig {
  length: number;
  expiryMinutes: number;
  maxAttempts: number;
  resendDelayMinutes: number;
}

export interface GenerateOtpResult {
  otpId: string;
  code: string;
  expiresAt: Date;
}

export interface VerifyOtpResult {
  success: boolean;
  message: string;
  remainingAttempts?: number;
}

export class OtpService {
  private emailService: EmailService;
  private config: OtpConfig;

  constructor(emailService: EmailService, config?: Partial<OtpConfig>) {
    this.emailService = emailService;
    this.config = {
      length: 6,
      expiryMinutes: 10,
      maxAttempts: 3,
      resendDelayMinutes: 1,
      ...config
    };
  }

  async generateOtp(email: string, type: OtpType, metadata?: Record<string, any>): Promise<GenerateOtpResult> {
    // Clean up expired OTPs for this email and type
    await this.cleanupExpiredOtps(email, type);

    // Check if there's a recent OTP that can't be resent yet
    const recentOtp = await prisma.otp.findFirst({
      where: {
        email: email.toLowerCase(),
        type,
        isUsed: false,
        createdAt: {
          gte: new Date(Date.now() - this.config.resendDelayMinutes * 60 * 1000)
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (recentOtp && !this.isOtpExpired(recentOtp.expiresAt)) {
      const waitTime = Math.ceil((this.config.resendDelayMinutes * 60 * 1000 - (Date.now() - recentOtp.createdAt.getTime())) / 1000);
      throw new Error(`Please wait ${waitTime} seconds before requesting another OTP`);
    }

    // Generate new OTP
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + this.config.expiryMinutes * 60 * 1000);

    const otp = await prisma.otp.create({
      data: {
        email: email.toLowerCase(),
        code,
        type,
        expiresAt,
        maxAttempts: this.config.maxAttempts,
        metadata: metadata || {}
      }
    });

    // Send OTP via email
    await this.sendOtpByEmail(email, code, type, expiresAt);


    return {
      otpId: otp.id,
      code, // In production, don't return the actual code
      expiresAt
    };
  }

  async verifyOtp(email: string, code: string, type: OtpType): Promise<VerifyOtpResult> {
    const otp = await prisma.otp.findFirst({
      where: {
        email: email.toLowerCase(),
        type,
        isUsed: false
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!otp) {
      return {
        success: false,
        message: 'No valid OTP found. Please request a new one.'
      };
    }

    // Check if OTP has expired
    if (this.isOtpExpired(otp.expiresAt)) {
      await this.markOtpAsUsed(otp.id);
      return {
        success: false,
        message: 'OTP has expired. Please request a new one.'
      };
    }

    // Check if max attempts exceeded
    if (otp.attempts >= otp.maxAttempts) {
      await this.markOtpAsUsed(otp.id);
      return {
        success: false,
        message: 'Maximum verification attempts exceeded. Please request a new OTP.'
      };
    }

    // Increment attempts
    await prisma.otp.update({
      where: { id: otp.id },
      data: { attempts: otp.attempts + 1 }
    });

    // Verify code
    if (otp.code !== code) {
      const remainingAttempts = otp.maxAttempts - (otp.attempts + 1);
      return {
        success: false,
        message: remainingAttempts > 0
          ? `Invalid OTP. ${remainingAttempts} attempts remaining.`
          : 'Invalid OTP. Maximum attempts exceeded.',
        remainingAttempts
      };
    }

    // Mark OTP as used
    await this.markOtpAsUsed(otp.id);

    return {
      success: true,
      message: 'OTP verified successfully.'
    };
  }

  async resendOtp(email: string, type: OtpType, metadata?: Record<string, any>): Promise<GenerateOtpResult> {
    // Check if user is requesting too frequently
    const recentOtp = await prisma.otp.findFirst({
      where: {
        email: email.toLowerCase(),
        type,
        createdAt: {
          gte: new Date(Date.now() - this.config.resendDelayMinutes * 60 * 1000)
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (recentOtp) {
      const waitTime = Math.ceil((this.config.resendDelayMinutes * 60 * 1000 - (Date.now() - recentOtp.createdAt.getTime())) / 1000);
      if (waitTime > 0) {
        throw new Error(`Please wait ${waitTime} seconds before requesting another OTP`);
      }
    }

    // Mark existing unused OTPs as used
    await prisma.otp.updateMany({
      where: {
        email: email.toLowerCase(),
        type,
        isUsed: false
      },
      data: { isUsed: true }
    });

    // Generate new OTP
    return await this.generateOtp(email, type, metadata);
  }

  async getOtpStatus(email: string, type: OtpType): Promise<{
    hasActiveOtp: boolean;
    expiresAt?: Date;
    attemptsUsed?: number;
    maxAttempts?: number;
    canResend: boolean;
    resendAvailableIn?: number;
  }> {
    const otp = await prisma.otp.findFirst({
      where: {
        email: email.toLowerCase(),
        type,
        isUsed: false
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!otp) {
      return {
        hasActiveOtp: false,
        canResend: true
      };
    }

    const isExpired = this.isOtpExpired(otp.expiresAt);
    const timeSinceCreation = Date.now() - otp.createdAt.getTime();
    const canResend = timeSinceCreation >= (this.config.resendDelayMinutes * 60 * 1000) || isExpired;

    return {
      hasActiveOtp: !isExpired,
      expiresAt: otp.expiresAt,
      attemptsUsed: otp.attempts,
      maxAttempts: otp.maxAttempts,
      canResend,
      resendAvailableIn: canResend ? 0 : Math.ceil((this.config.resendDelayMinutes * 60 * 1000 - timeSinceCreation) / 1000)
    };
  }

  private generateCode(): string {
    const min = Math.pow(10, this.config.length - 1);
    const max = Math.pow(10, this.config.length) - 1;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  }

  private isOtpExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }

  private async markOtpAsUsed(otpId: string): Promise<void> {
    await prisma.otp.update({
      where: { id: otpId },
      data: { isUsed: true }
    });
  }

  private async cleanupExpiredOtps(email?: string, type?: OtpType): Promise<void> {
    const where: any = {
      expiresAt: { lt: new Date() }
    };

    if (email) where.email = email.toLowerCase();
    if (type) where.type = type;

    await prisma.otp.updateMany({
      where,
      data: { isUsed: true }
    });
  }

  private async sendOtpByEmail(email: string, code: string, type: OtpType, expiresAt: Date): Promise<void> {
    try {
      switch (type) {
        case OtpType.EMAIL_VERIFICATION:
          await this.emailService.sendOtpEmail(email, code, type, expiresAt);
          break;
        case OtpType.PASSWORD_RESET:
          await this.emailService.sendOtpEmail(email, code, type, expiresAt);
          break;
        case OtpType.REGISTRATION:
          await this.emailService.sendOtpEmail(email, code, type, expiresAt);
          break;
        default:
          throw new Error(`Unsupported OTP type: ${type}`);
      }
    } catch (error) {
      console.error(`Failed to send OTP email to ${email}:`, error);
      // In development, we can continue without email, but in production you might want to throw
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Failed to send verification code. Please try again.');
      }
    }
  }

  // Cleanup old OTPs (should be called periodically)
  async cleanupOldOtps(olderThanHours: number = 24): Promise<number> {
    const cutoffDate = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);

    const result = await prisma.otp.deleteMany({
      where: {
        createdAt: { lt: cutoffDate }
      }
    });

    return result.count;
  }

  // Get OTP statistics
  async getOtpStats(): Promise<{
    total: number;
    active: number;
    expired: number;
    used: number;
    byType: Record<string, number>;
  }> {
    const [total, active, expired, used, byType] = await Promise.all([
      prisma.otp.count(),
      prisma.otp.count({
        where: {
          isUsed: false,
          expiresAt: { gt: new Date() }
        }
      }),
      prisma.otp.count({
        where: {
          expiresAt: { lt: new Date() }
        }
      }),
      prisma.otp.count({
        where: { isUsed: true }
      }),
      prisma.otp.groupBy({
        by: ['type'],
        _count: { id: true }
      })
    ]);

    return {
      total,
      active,
      expired,
      used,
      byType: byType.reduce((acc, item) => ({
        ...acc,
        [item.type]: item._count.id
      }), {})
    };
  }
}