import bcrypt from 'bcryptjs';


import {
  StartRegistrationRequest,
  VerifyEmailRequest,
  CompleteRegistrationRequest,
  UserPayload
} from '../types/auth.types';
import { authConfig } from '../config/auth.config';
import {
  RegistrationStep,
  OtpType,
  UserRole as PrismaUserRole,
  Permission as PrismaPermission
} from '@prisma/client';
import { OtpService } from './otp.service';
import { EmailServiceFactory } from './email/email-service.factory';
import { EmailService } from './email.service';
import prisma from '@/config/database.config';

export interface RegistrationFlowStatus {
  step: RegistrationStep;
  email: string;
  expiresAt: Date;
  canResendOtp: boolean;
  otpAttemptsUsed?: number;
  nextStepAvailableIn?: number;
}

export class RegistrationService {
  private otpService: OtpService;
  private emailService: EmailService;
  private readonly FLOW_EXPIRY_HOURS = 24;

  constructor() {
    // Initialize email service using factory
    this.emailService = EmailServiceFactory.create();
    this.otpService = new OtpService(this.emailService);
  }

  // Step 1: Start registration with email
  async startRegistration(request: StartRegistrationRequest): Promise<{
    flowId: string;
    message: string;
    expiresAt: Date;
  }> {
    const { email } = request;
    const normalizedEmail = email.toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      throw new Error('An account with this email already exists');
    }

    // Check if there's an active registration flow
    const existingFlow = await prisma.registrationFlow.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingFlow && !this.isFlowExpired(existingFlow.expiresAt)) {
      // Update existing flow
      const updatedFlow = await prisma.registrationFlow.update({
        where: { id: existingFlow.id },
        data: {
          step: RegistrationStep.OTP_PENDING,
          updatedAt: new Date()
        }
      });

      // Generate new OTP
      await this.otpService.generateOtp(normalizedEmail, OtpType.EMAIL_VERIFICATION, {
        flowId: updatedFlow.id,
        step: 'email_verification'
      });

      return {
        flowId: updatedFlow.id,
        message: 'Verification code sent to your email',
        expiresAt: updatedFlow.expiresAt
      };
    }

    // Create new registration flow
    const expiresAt = new Date(Date.now() + this.FLOW_EXPIRY_HOURS * 60 * 60 * 1000);

    const flow = await prisma.registrationFlow.create({
      data: {
        email: normalizedEmail,
        step: RegistrationStep.OTP_PENDING,
        expiresAt,
        tempData: {
          startedAt: new Date().toISOString(),
          userAgent: 'unknown', // Can be passed from request
          ipAddress: 'unknown'  // Can be passed from request
        }
      }
    });

    // Generate OTP for email verification
    await this.otpService.generateOtp(normalizedEmail, OtpType.EMAIL_VERIFICATION, {
      flowId: flow.id,
      step: 'email_verification'
    });


    return {
      flowId: flow.id,
      message: 'Verification code sent to your email',
      expiresAt
    };
  }

  // Step 2: Verify email with OTP
  async verifyEmail(request: VerifyEmailRequest): Promise<{
    success: boolean;
    message: string;
    nextStep?: string;
  }> {
    const { email, otp } = request;
    const normalizedEmail = email.toLowerCase();

    // Find active registration flow
    const flow = await prisma.registrationFlow.findUnique({
      where: { email: normalizedEmail }
    });

    if (!flow || this.isFlowExpired(flow.expiresAt)) {
      throw new Error('Registration session expired. Please start over.');
    }

    if (flow.step !== RegistrationStep.OTP_PENDING) {
      throw new Error('Email verification not required at this step');
    }

    // Verify OTP
    const otpResult = await this.otpService.verifyOtp(normalizedEmail, otp, OtpType.EMAIL_VERIFICATION);

    if (!otpResult.success) {
      return {
        success: false,
        message: otpResult.message
      };
    }

    // Update registration flow to next step
    await prisma.registrationFlow.update({
      where: { id: flow.id },
      data: {
        step: RegistrationStep.DETAILS_PENDING,
        updatedAt: new Date(),
        tempData: {
          ...((flow.tempData as any) || {}),
          emailVerifiedAt: new Date().toISOString()
        }
      }
    });


    return {
      success: true,
      message: 'Email verified successfully',
      nextStep: 'complete_registration'
    };
  }

  // Step 3: Complete registration with user details
  async completeRegistration(request: CompleteRegistrationRequest): Promise<{
    user: UserPayload;
    message: string;
  }> {
    const { email, password, confirmPassword, firstName, lastName, acceptTerms } = request;
    const normalizedEmail = email.toLowerCase();

    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    if (!acceptTerms) {
      throw new Error('You must accept the terms and conditions');
    }

    // Find and validate registration flow
    const flow = await prisma.registrationFlow.findUnique({
      where: { email: normalizedEmail }
    });

    if (!flow || this.isFlowExpired(flow.expiresAt)) {
      throw new Error('Registration session expired. Please start over.');
    }

    if (flow.step !== RegistrationStep.DETAILS_PENDING) {
      throw new Error('Email verification required before completing registration');
    }

    // Check if user was created in the meantime
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      throw new Error('An account with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, authConfig.bcryptRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        firstName,
        lastName,
        role: PrismaUserRole.USER,
        permissions: [PrismaPermission.USER_READ],
        isActive: true,
        isVerified: true, // Email already verified in step 2
        metadata: {
          registrationFlowId: flow.id,
          registrationCompletedAt: new Date().toISOString(),
          source: '3_step_registration'
        }
      }
    });

    // Mark registration flow as completed
    await prisma.registrationFlow.update({
      where: { id: flow.id },
      data: {
        step: RegistrationStep.COMPLETED,
        updatedAt: new Date(),
        tempData: {
          ...((flow.tempData as any) || {}),
          completedAt: new Date().toISOString(),
          userId: user.id
        }
      }
    });

    // Send welcome email
    try {
      await this.emailService.sendWelcomeEmail(normalizedEmail, {
        userName: firstName,
        userEmail: normalizedEmail,
        dashboardUrl: 'https://qubdrive.com/',
        isEmailVerificationRequired: false // Email already verified
      });
    } catch (error) {
      console.warn('Failed to send welcome email:', error);
      // Don't fail registration if email fails
    }




    const userPayload: UserPayload = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as any,
      permissions: user.permissions as any,
      isActive: user.isActive,
      isVerified: user.isVerified,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes expiry
    };

    return {
      user: userPayload,
      message: 'Registration completed successfully'
    };
  }

  // Get registration flow status
  async getRegistrationStatus(email: string): Promise<RegistrationFlowStatus | null> {
    const normalizedEmail = email.toLowerCase();

    const flow = await prisma.registrationFlow.findUnique({
      where: { email: normalizedEmail }
    });

    if (!flow || this.isFlowExpired(flow.expiresAt)) {
      return null;
    }

    // Get OTP status if needed
    let canResendOtp = false;
    let otpAttemptsUsed = 0;

    if (flow.step === RegistrationStep.OTP_PENDING) {
      const otpStatus = await this.otpService.getOtpStatus(normalizedEmail, OtpType.EMAIL_VERIFICATION);
      canResendOtp = otpStatus.canResend;
      otpAttemptsUsed = otpStatus.attemptsUsed || 0;
    }

    return {
      step: flow.step,
      email: flow.email,
      expiresAt: flow.expiresAt,
      canResendOtp,
      otpAttemptsUsed
    };
  }

  // Resend OTP for email verification
  async resendVerificationOtp(email: string): Promise<{
    message: string;
    expiresAt: Date;
  }> {
    const normalizedEmail = email.toLowerCase();

    // Check registration flow
    const flow = await prisma.registrationFlow.findUnique({
      where: { email: normalizedEmail }
    });

    if (!flow || this.isFlowExpired(flow.expiresAt)) {
      throw new Error('Registration session expired. Please start over.');
    }

    if (flow.step !== RegistrationStep.OTP_PENDING) {
      throw new Error('OTP resend not available at this step');
    }

    // Resend OTP
    const otpResult = await this.otpService.resendOtp(normalizedEmail, OtpType.EMAIL_VERIFICATION, {
      flowId: flow.id,
      step: 'email_verification'
    });

    return {
      message: 'Verification code resent to your email',
      expiresAt: otpResult.expiresAt
    };
  }

  // Cancel registration flow
  async cancelRegistration(email: string): Promise<{ message: string }> {
    const normalizedEmail = email.toLowerCase();

    const flow = await prisma.registrationFlow.findUnique({
      where: { email: normalizedEmail }
    });

    if (flow) {
      await prisma.registrationFlow.delete({
        where: { id: flow.id }
      });

      // Also clean up any related OTPs
      await prisma.otp.updateMany({
        where: {
          email: normalizedEmail,
          type: OtpType.EMAIL_VERIFICATION,
          isUsed: false
        },
        data: { isUsed: true }
      });

    }

    return { message: 'Registration cancelled successfully' };
  }

  // Cleanup expired registration flows
  async cleanupExpiredFlows(): Promise<number> {
    const result = await prisma.registrationFlow.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    });

    return result.count;
  }

  private isFlowExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }

  // Get registration statistics
  async getRegistrationStats(): Promise<{
    totalFlows: number;
    activeFlows: number;
    completedFlows: number;
    expiredFlows: number;
    byStep: Record<string, number>;
  }> {
    const [total, active, completed, expired, byStep] = await Promise.all([
      prisma.registrationFlow.count(),
      prisma.registrationFlow.count({
        where: {
          expiresAt: { gt: new Date() },
          step: { not: RegistrationStep.COMPLETED }
        }
      }),
      prisma.registrationFlow.count({
        where: { step: RegistrationStep.COMPLETED }
      }),
      prisma.registrationFlow.count({
        where: { expiresAt: { lt: new Date() } }
      }),
      prisma.registrationFlow.groupBy({
        by: ['step'],
        _count: { id: true }
      })
    ]);

    return {
      totalFlows: total,
      activeFlows: active,
      completedFlows: completed,
      expiredFlows: expired,
      byStep: byStep.reduce((acc, item) => ({
        ...acc,
        [item.step]: item._count.id
      }), {})
    };
  }
}