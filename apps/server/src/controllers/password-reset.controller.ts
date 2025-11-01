import { ServerResponse } from 'node:http';
import { PasswordResetService } from '../services/password-reset.service';
import { AuthenticatedRequest, ApiResponse } from '../middleware/auth.middleware';
import {
  ForgotPasswordRequest,
  ResetPasswordWithOtpRequest,
  ResendOtpRequest
} from '../types/auth.types';

class PasswordResetController {
  private passwordResetService: PasswordResetService;

  constructor() {
    this.passwordResetService = new PasswordResetService();
  }

  // Step 1: Request password reset (forgot password)
  requestPasswordReset = async (req: AuthenticatedRequest, res: ServerResponse): Promise<void> => {
    try {
      const { email }: ForgotPasswordRequest = req.body;

      if (!email) {
        this.handleError(res, new Error('Email is required'), 'Email is required', 400);
        return;
      }

      const result = await this.passwordResetService.requestPasswordReset({ email });

      const response: ApiResponse = {
        success: true,
        data: result.resetId ? {
          resetId: result.resetId,
          expiresAt: result.expiresAt,
          nextStep: 'verify_otp'
        } : undefined,
        message: result.message,
        timestamp: new Date().toISOString()
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response, null, 2));
    } catch (error) {
      this.handleError(res, error, 'Failed to request password reset');
    }
  };

  // Step 2: Reset password with OTP
  resetPasswordWithOtp = async (req: AuthenticatedRequest, res: ServerResponse): Promise<void> => {
    try {
      const resetData: ResetPasswordWithOtpRequest = req.body;

      const { email, otp, newPassword, confirmPassword } = resetData;

      if (!email || !otp || !newPassword || !confirmPassword) {
        this.handleError(res, new Error('All fields are required'), 'All fields are required', 400);
        return;
      }

      const result = await this.passwordResetService.resetPasswordWithOtp(resetData);

      const response: ApiResponse = {
        success: result.success,
        message: result.message,
        timestamp: new Date().toISOString()
      };

      const statusCode = result.success ? 200 : 400;
      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response, null, 2));
    } catch (error) {
      this.handleError(res, error, 'Password reset failed');
    }
  };

  // Verify OTP without resetting password (optional intermediate step)
  verifyResetOtp = async (req: AuthenticatedRequest, res: ServerResponse): Promise<void> => {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        this.handleError(res, new Error('Email and OTP are required'), 'Email and OTP are required', 400);
        return;
      }

      const result = await this.passwordResetService.verifyResetOtp(email, otp);

      const response: ApiResponse = {
        success: result.success,
        data: result.success ? {
          validFor: result.validFor,
          nextStep: 'set_new_password'
        } : undefined,
        message: result.message,
        timestamp: new Date().toISOString()
      };

      const statusCode = result.success ? 200 : 400;
      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response, null, 2));
    } catch (error) {
      this.handleError(res, error, 'OTP verification failed');
    }
  };

  // Get password reset status
  getResetStatus = async (req: AuthenticatedRequest, res: ServerResponse): Promise<void> => {
    try {
      const email = req.query?.email as string;

      if (!email) {
        this.handleError(res, new Error('Email is required'), 'Email parameter is required', 400);
        return;
      }

      const status = await this.passwordResetService.getResetStatus(email);

      const response: ApiResponse = {
        success: true,
        data: {
          status: status || null,
          hasActiveReset: status !== null
        },
        message: status ? 'Password reset status retrieved' : 'No active password reset found',
        timestamp: new Date().toISOString()
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response, null, 2));
    } catch (error) {
      this.handleError(res, error, 'Failed to get reset status');
    }
  };

  // Resend password reset OTP
  resendResetOtp = async (req: AuthenticatedRequest, res: ServerResponse): Promise<void> => {
    try {
      const { email }: ResendOtpRequest = req.body;

      if (!email) {
        this.handleError(res, new Error('Email is required'), 'Email is required', 400);
        return;
      }

      const result = await this.passwordResetService.resendResetOtp(email);

      const response: ApiResponse = {
        success: true,
        data: {
          expiresAt: result.expiresAt
        },
        message: result.message,
        timestamp: new Date().toISOString()
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response, null, 2));
    } catch (error) {
      this.handleError(res, error, 'Failed to resend reset OTP');
    }
  };

  // Cancel password reset
  cancelReset = async (req: AuthenticatedRequest, res: ServerResponse): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        this.handleError(res, new Error('Email is required'), 'Email is required', 400);
        return;
      }

      const result = await this.passwordResetService.cancelReset(email);

      const response: ApiResponse = {
        success: true,
        message: result.message,
        timestamp: new Date().toISOString()
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response, null, 2));
    } catch (error) {
      this.handleError(res, error, 'Failed to cancel reset');
    }
  };

  // Get password reset statistics (Admin only)
  getResetStats = async (req: AuthenticatedRequest, res: ServerResponse): Promise<void> => {
    try {
      if (!req.user) {
        this.handleError(res, new Error('Authentication required'), 'Authentication required', 401);
        return;
      }

      if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
        this.handleError(res, new Error('Admin access required'), 'Admin access required', 403);
        return;
      }

      const stats = await this.passwordResetService.getResetStats();

      const response: ApiResponse = {
        success: true,
        data: { stats },
        message: 'Password reset statistics retrieved successfully',
        timestamp: new Date().toISOString()
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response, null, 2));
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve reset statistics');
    }
  };

  private handleError(res: ServerResponse, error: unknown, defaultMessage: string, statusCode = 500): void {
    const message = error instanceof Error ? error.message : defaultMessage;

    const response: ApiResponse = {
      success: false,
      error: defaultMessage,
      message,
      timestamp: new Date().toISOString()
    };

    console.error(`[PasswordResetController] ${defaultMessage}:`, error);

    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response, null, 2));
  }
}

const passwordResetController = new PasswordResetController();
export default passwordResetController;