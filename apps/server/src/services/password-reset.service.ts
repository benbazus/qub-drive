import bcrypt from 'bcryptjs';
import prisma from '../config/database.config';
import { OtpService } from './otp.service';
import { EmailService } from './email.service';
import {
  ForgotPasswordRequest,
  ResetPasswordWithOtpRequest
} from '../types/auth.types.js';
import { authConfig } from '../config/auth.config';
import { OtpType, SecurityEventType } from '@prisma/client';
import { EmailServiceFactory } from './email/email-service.factory';

export interface PasswordResetStatus {
  isActive: boolean;
  email: string;
  expiresAt?: Date;
  canResendOtp: boolean;
  otpAttemptsUsed?: number;
  resendAvailableIn?: number;
}

export class PasswordResetService {
  private otpService: OtpService;
  private emailService: EmailService;
  private readonly RESET_EXPIRY_HOURS = 1; // Password reset flows expire in 1 hour

  constructor() {
    this.emailService = EmailServiceFactory.create();
    this.otpService = new OtpService(this.emailService);
  }

  // Step 1: Request password reset
  async requestPasswordReset(request: ForgotPasswordRequest): Promise<{
    message: string;
    resetId?: string;
    expiresAt?: Date;
  }> {
    const { email } = request;
    const normalizedEmail = email.toLowerCase();

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    // Always return success message for security (don't reveal if email exists)
    if (!user) {
      console.log(`🔒 Password reset requested for non-existent email: ${normalizedEmail}`);
      return {
        message: 'If an account with this email exists, you will receive a password reset code shortly.'
      };
    }

    if (!user.isActive) {
      console.log(`🔒 Password reset requested for inactive user: ${normalizedEmail}`);
      return {
        message: 'If an account with this email exists, you will receive a password reset code shortly.'
      };
    }

    // Check if there's an active password reset flow
    const existingFlow = await prisma.passwordResetFlow.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingFlow && !this.isFlowExpired(existingFlow.expiresAt)) {
      // Update existing flow
      const updatedFlow = await prisma.passwordResetFlow.update({
        where: { id: existingFlow.id },
        data: {
          isActive: true,
          createdAt: new Date()
        }
      });

      // Generate new OTP
      await this.otpService.generateOtp(normalizedEmail, OtpType.PASSWORD_RESET, {
        resetFlowId: updatedFlow.id,
        userId: user.id
      });

      return {
        message: 'Password reset code sent to your email',
        resetId: updatedFlow.id,
        expiresAt: updatedFlow.expiresAt
      };
    }

    // Create new password reset flow
    const expiresAt = new Date(Date.now() + this.RESET_EXPIRY_HOURS * 60 * 60 * 1000);

    const resetFlow = await prisma.passwordResetFlow.create({
      data: {
        email: normalizedEmail,
        isActive: true,
        expiresAt
      }
    });

    // Generate OTP for password reset
    await this.otpService.generateOtp(normalizedEmail, OtpType.PASSWORD_RESET, {
      resetFlowId: resetFlow.id,
      userId: user.id
    });

    // Log security event
    await prisma.securityEvent.create({
      data: {
        eventType: SecurityEventType.PASSWORD_CHANGE,
        userId: user.id,
        email: user.email,
        ipAddress: 'unknown', // Can be passed from request
        userAgent: 'unknown', // Can be passed from request
        success: true,
        metadata: {
          action: 'password_reset_requested',
          resetFlowId: resetFlow.id
        },
        createdAt: new Date()
      }
    });

    console.log(`🔑 Password reset requested for ${normalizedEmail} - Reset ID: ${resetFlow.id}`);

    return {
      message: 'Password reset code sent to your email',
      resetId: resetFlow.id,
      expiresAt
    };
  }

  // Step 2: Reset password with OTP
  async resetPasswordWithOtp(request: ResetPasswordWithOtpRequest): Promise<{
    success: boolean;
    message: string;
  }> {
    const { email, otp, newPassword, confirmPassword } = request;
    const normalizedEmail = email.toLowerCase();

    if (newPassword !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    // Validate password strength (basic validation)
    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user || !user.isActive) {
      throw new Error('Invalid or expired password reset request');
    }

    // Find active password reset flow
    const resetFlow = await prisma.passwordResetFlow.findUnique({
      where: { email: normalizedEmail }
    });

    if (!resetFlow || !resetFlow.isActive || this.isFlowExpired(resetFlow.expiresAt)) {
      throw new Error('Invalid or expired password reset request');
    }

    // Verify OTP
    const otpResult = await this.otpService.verifyOtp(normalizedEmail, otp, OtpType.PASSWORD_RESET);

    if (!otpResult.success) {
      return {
        success: false,
        message: otpResult.message
      };
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, authConfig.bcryptRounds);

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        updatedAt: new Date()
      }
    });

    // Deactivate the reset flow
    await prisma.passwordResetFlow.update({
      where: { id: resetFlow.id },
      data: { isActive: false }
    });

    // Revoke all active sessions for security
    await prisma.session.updateMany({
      where: { userId: user.id },
      data: { isActive: false }
    });

    // Log security event
    await prisma.securityEvent.create({
      data: {
        eventType: SecurityEventType.PASSWORD_CHANGE,
        userId: user.id,
        email: user.email,
        ipAddress: 'unknown', // Can be passed from request
        userAgent: 'unknown', // Can be passed from request
        success: true,
        metadata: {
          action: 'password_reset_completed',
          resetFlowId: resetFlow.id,
          sessionsRevoked: true
        },
        createdAt: new Date()
      }
    });

    console.log(`🔑 Password reset completed for ${normalizedEmail} - User ID: ${user.id}`);

    return {
      success: true,
      message: 'Password reset successfully. Please log in with your new password.'
    };
  }

  // Verify OTP without resetting password (optional step)
  async verifyResetOtp(email: string, otp: string): Promise<{
    success: boolean;
    message: string;
    validFor?: number; // Minutes remaining to complete reset
  }> {
    const normalizedEmail = email.toLowerCase();

    // Find active password reset flow
    const resetFlow = await prisma.passwordResetFlow.findUnique({
      where: { email: normalizedEmail }
    });

    if (!resetFlow || !resetFlow.isActive || this.isFlowExpired(resetFlow.expiresAt)) {
      return {
        success: false,
        message: 'Invalid or expired password reset request'
      };
    }

    // Verify OTP (but don't mark as used)
    const otpResult = await this.otpService.verifyOtp(normalizedEmail, otp, OtpType.PASSWORD_RESET);

    if (!otpResult.success) {
      return {
        success: false,
        message: otpResult.message
      };
    }

    const validFor = Math.ceil((resetFlow.expiresAt.getTime() - Date.now()) / (1000 * 60));

    return {
      success: true,
      message: 'OTP verified. You can now set your new password.',
      validFor
    };
  }

  // Get password reset status
  async getResetStatus(email: string): Promise<PasswordResetStatus | null> {
    const normalizedEmail = email.toLowerCase();

    const resetFlow = await prisma.passwordResetFlow.findUnique({
      where: { email: normalizedEmail }
    });

    if (!resetFlow || !resetFlow.isActive || this.isFlowExpired(resetFlow.expiresAt)) {
      return null;
    }

    // Get OTP status
    const otpStatus = await this.otpService.getOtpStatus(normalizedEmail, OtpType.PASSWORD_RESET);

    return {
      isActive: true,
      email: resetFlow.email,
      expiresAt: resetFlow.expiresAt,
      canResendOtp: otpStatus.canResend,
      otpAttemptsUsed: otpStatus.attemptsUsed,
      resendAvailableIn: otpStatus.resendAvailableIn
    };
  }

  // Resend password reset OTP
  async resendResetOtp(email: string): Promise<{
    message: string;
    expiresAt: Date;
  }> {
    const normalizedEmail = email.toLowerCase();

    // Check reset flow
    const resetFlow = await prisma.passwordResetFlow.findUnique({
      where: { email: normalizedEmail }
    });

    if (!resetFlow || !resetFlow.isActive || this.isFlowExpired(resetFlow.expiresAt)) {
      throw new Error('No active password reset request found');
    }

    // Get user for logging
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    // Resend OTP
    const otpResult = await this.otpService.resendOtp(normalizedEmail, OtpType.PASSWORD_RESET, {
      resetFlowId: resetFlow.id,
      userId: user?.id
    });

    return {
      message: 'Password reset code resent to your email',
      expiresAt: otpResult.expiresAt
    };
  }

  // Cancel password reset
  async cancelReset(email: string): Promise<{ message: string }> {
    const normalizedEmail = email.toLowerCase();

    const resetFlow = await prisma.passwordResetFlow.findUnique({
      where: { email: normalizedEmail }
    });

    if (resetFlow && resetFlow.isActive) {
      await prisma.passwordResetFlow.update({
        where: { id: resetFlow.id },
        data: { isActive: false }
      });

      // Also clean up any related OTPs
      await prisma.otp.updateMany({
        where: {
          email: normalizedEmail,
          type: OtpType.PASSWORD_RESET,
          isUsed: false
        },
        data: { isUsed: true }
      });

      console.log(`❌ Password reset cancelled for ${normalizedEmail}`);
    }

    return { message: 'Password reset cancelled successfully' };
  }

  // Cleanup expired password reset flows
  async cleanupExpiredResets(): Promise<number> {
    const result = await prisma.passwordResetFlow.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isActive: false, createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // Inactive for 24h
        ]
      }
    });

    console.log(`🧹 Cleaned up ${result.count} expired password reset flows`);
    return result.count;
  }

  private isFlowExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }

  // Get password reset statistics
  async getResetStats(): Promise<{
    totalResets: number;
    activeResets: number;
    completedResets: number;
    expiredResets: number;
    successRate: number;
  }> {
    const [total, active, expired] = await Promise.all([
      prisma.passwordResetFlow.count(),
      prisma.passwordResetFlow.count({
        where: {
          isActive: true,
          expiresAt: { gt: new Date() }
        }
      }),
      prisma.passwordResetFlow.count({
        where: { expiresAt: { lt: new Date() } }
      })
    ]);

    // Count successful resets from security events
    const completedResets = await prisma.securityEvent.count({
      where: {
        eventType: SecurityEventType.PASSWORD_CHANGE,
        success: true,
        metadata: {
          path: ['action'],
          equals: 'password_reset_completed'
        }
      }
    });

    const successRate = total > 0 ? (completedResets / total) * 100 : 0;

    return {
      totalResets: total,
      activeResets: active,
      completedResets,
      expiredResets: expired,
      successRate: Math.round(successRate * 100) / 100
    };
  }
}