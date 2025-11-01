import { Response } from 'express';
import { RegistrationService } from '../services/registration.service';
import {
  StartRegistrationRequest,
  VerifyEmailRequest,
  CompleteRegistrationRequest,
  ResendOtpRequest
} from '../types/auth.types';
import { ApiResponse, AuthenticatedRequest } from '../middleware/auth.middleware';
import { ServerResponse } from 'node:http';

export class RegistrationController {
  private registrationService: RegistrationService;

  constructor() {
    this.registrationService = new RegistrationService();
  }




  //===================================================================
  // Step 1: Start registration with email
  startRegistration = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { email }: StartRegistrationRequest = req.body;

      if (!email) {
        this.handleError(res, new Error('Email is required'), 'Email is required', 400);
        return;
      }

      const result = await this.registrationService.startRegistration({ email });

      const response: ApiResponse = {
        success: true,
        data: {
          flowId: result.flowId,
          expiresAt: result.expiresAt,
          nextStep: 'verify_email'
        },
        message: result.message,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      this.handleError(res, error, 'Failed to start registration');
    }
  };

  // Step 2: Verify email with OTP
  verifyEmail = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { email, otp }: VerifyEmailRequest = req.body;

      if (!email || !otp) {
        this.handleError(res, new Error('Email and OTP are required'), 'Email and OTP are required', 400);
        return;
      }

      const result = await this.registrationService.verifyEmail({ email, otp });

      const response: ApiResponse = {
        success: result.success,
        data: result.success ? {
          nextStep: result.nextStep
        } : undefined,
        message: result.message,
        timestamp: new Date().toISOString()
      };

      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json(response);
    } catch (error) {
      this.handleError(res, error, 'Email verification failed');
    }
  };

  // Step 3: Complete registration
  completeRegistration = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const registrationData: CompleteRegistrationRequest = req.body;

      const { email, password, confirmPassword, firstName, lastName, acceptTerms } = registrationData;

      if (!email || !password || !confirmPassword || !firstName || !lastName || !acceptTerms) {
        this.handleError(res, new Error('All fields are required'), 'All fields are required', 400);
        return;
      }

      const result = await this.registrationService.completeRegistration(registrationData);

      const response: ApiResponse = {
        success: true,
        data: {
          user: result.user
        },
        message: result.message,
        timestamp: new Date().toISOString()
      };

      res.status(201).json(response);
    } catch (error) {
      this.handleError(res, error, 'Registration completion failed');
    }
  };

  // Get registration status
  getRegistrationStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const email = req.query?.email as string;

      if (!email) {
        this.handleError(res, new Error('Email is required'), 'Email parameter is required', 400);
        return;
      }

      const status = await this.registrationService.getRegistrationStatus(email);

      const response: ApiResponse = {
        success: true,
        data: {
          status: status || null,
          hasActiveFlow: status !== null
        },
        message: status ? 'Registration status retrieved' : 'No active registration flow found',
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      this.handleError(res, error, 'Failed to get registration status');
    }
  };

  // Resend verification OTP
  resendVerificationOtp = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { email }: ResendOtpRequest = req.body;

      if (!email) {
        this.handleError(res, new Error('Email is required'), 'Email is required', 400);
        return;
      }

      const result = await this.registrationService.resendVerificationOtp(email);

      const response: ApiResponse = {
        success: true,
        data: {
          expiresAt: result.expiresAt
        },
        message: result.message,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      this.handleError(res, error, 'Failed to resend verification OTP');
    }
  };

  // Cancel registration
  cancelRegistration = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        this.handleError(res, new Error('Email is required'), 'Email is required', 400);
        return;
      }

      const result = await this.registrationService.cancelRegistration(email);

      const response: ApiResponse = {
        success: true,
        message: result.message,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      this.handleError(res, error, 'Failed to cancel registration');
    }
  };

  // Get registration statistics (Admin only)
  getRegistrationStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        this.handleError(res, new Error('Authentication required'), 'Authentication required', 401);
        return;
      }

      if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
        this.handleError(res, new Error('Admin access required'), 'Admin access required', 403);
        return;
      }

      const stats = await this.registrationService.getRegistrationStats();

      const response: ApiResponse = {
        success: true,
        data: { stats },
        message: 'Registration statistics retrieved successfully',
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve registration statistics');
    }
  };

  private handleError(res: Response, error: unknown, defaultMessage: string, statusCode = 500): void {
    const message = error instanceof Error ? error.message : defaultMessage;

    const response: ApiResponse = {
      success: false,
      error: defaultMessage,
      message,
      timestamp: new Date().toISOString()
    };

    console.error(`[RegistrationController] ${defaultMessage}:`, error);

    res.status(statusCode).json(response);
  }
}