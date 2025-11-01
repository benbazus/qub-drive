import { ServerResponse } from 'node:http';
import authService from '../services/auth.service';
import { ApiResponse, AuthenticatedRequest } from '../middleware/auth.middleware';
import { ChangePasswordRequest, LoginCredentials, RefreshTokenRequest, RegisterCredentials } from '../types/auth.types';
import prisma from '../config/database.config';


class AuthController {
  constructor() { }

  register = async (req: AuthenticatedRequest, res: ServerResponse): Promise<void> => {
    try {

      const credentials: RegisterCredentials = req.body;
      const deviceInfo = req.deviceInfo;

      const result = await authService.register(credentials, deviceInfo);

      const response: ApiResponse = {
        success: true,
        data: {
          user: result.user,
          tokens: result.tokens
        },
        message: 'User registered successfully',
        timestamp: new Date().toISOString()
      };

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response, null, 2));
    } catch (error) {
      this.handleError(res, error, 'Registration failed');
    }
  };

  login = async (req: AuthenticatedRequest, res: ServerResponse): Promise<void> => {
    try {


      const credentials: LoginCredentials = req.body;
      const deviceInfo = req.deviceInfo;

      const result = await authService.login(credentials, deviceInfo);

      const response: ApiResponse = {
        success: true,
        data: {
          user: result.user,
          tokens: result.tokens
        },
        message: 'Login successful',
        timestamp: new Date().toISOString()
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response, null, 2));
    } catch (error) {
      this.handleError(res, error, 'Login failed', 401);
    }
  };

  refreshToken = async (req: AuthenticatedRequest, res: ServerResponse): Promise<void> => {
    try {
      const { refreshToken }: RefreshTokenRequest = req.body;
      const deviceInfo = req.deviceInfo;

      const tokens = await authService.refreshToken(refreshToken, deviceInfo);

      const response: ApiResponse = {
        success: true,
        data: { tokens },
        message: 'Token refreshed successfully',
        timestamp: new Date().toISOString()
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response, null, 2));
    } catch (error) {
      this.handleError(res, error, 'Token refresh failed', 401);
    }
  };

  logout = async (req: AuthenticatedRequest, res: ServerResponse): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '') || '';
      const deviceInfo = req.deviceInfo;

      await authService.logout(token, deviceInfo);

      const response: ApiResponse = {
        success: true,
        message: 'Logout successful',
        timestamp: new Date().toISOString()
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response, null, 2));
    } catch (error) {
      this.handleError(res, error, 'Logout failed');
    }
  };

  getProfile = async (req: AuthenticatedRequest, res: ServerResponse): Promise<void> => {
    try {
      if (!req.user) {
        this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
        return;
      }

      const user = await authService.getUserById(req.user.userId);
      if (!user) {
        this.handleError(res, new Error('User not found'), 'User not found', 404);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: { user },
        message: 'Profile retrieved successfully',
        timestamp: new Date().toISOString()
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response, null, 2));
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve profile');
    }
  };

  getCurrentUser = async (req: AuthenticatedRequest, res: ServerResponse): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        this.handleError(res, new Error('Session ID required'), 'Session ID is required', 400);
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          isActive: true,
          isEmailVerified: true,
          twoFactorEnabled: true,
          lastLoginAt: true,
          createdAt: true,
          // roles?: {
          //   include: {
          //     role: {
          //       include: {
          //         permissions: {
          //           include: {
          //             permission: true
          //           }
          //         }
          //       }
          //     }
          //   }
          // }
        }
      });

      if (!user) {
        this.handleError(res, new Error('Not Found'), 'User not found', 400);
        return;
      }

      const response = {
        id: user?.id,
        email: user?.email,
        firstName: user?.firstName,
        lastName: user?.lastName,
        phoneNumber: user?.phoneNumber,
        isActive: user?.isActive,
        isEmailVerified: user?.isEmailVerified,
        twoFactorEnabled: user?.twoFactorEnabled,
        lastLoginAt: user?.lastLoginAt,
        createdAt: user?.createdAt,
        // roles: user?.roles.map((ur) => ({
        //   name: ur.role.name,
        //   permissions: ur.role.permissions.map((rp) => rp.permission.name),
        // }))
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response, null, 2));
    } catch (error: any) {
      console.error('Get current user error:', error);
      this.handleError(res, error, 'Failed to revoke session');
    }
  }

  changePassword = async (req: AuthenticatedRequest, res: ServerResponse): Promise<void> => {
    try {
      if (!req.user) {
        this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
        return;
      }

      const { currentPassword, newPassword }: ChangePasswordRequest = req.body;

      await authService.changePassword(req.user.userId, currentPassword, newPassword);

      const response: ApiResponse = {
        success: true,
        message: 'Password changed successfully',
        timestamp: new Date().toISOString()
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response, null, 2));
    } catch (error) {
      this.handleError(res, error, 'Password change failed', 400);
    }
  };

  getActiveSessions = async (req: AuthenticatedRequest, res: ServerResponse): Promise<void> => {
    try {
      if (!req.user) {
        this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
        return;
      }

      const sessions = await authService.getActiveSessions(req.user.userId);

      const sanitizedSessions = sessions.map(session => ({
        id: session.id,
        deviceInfo: session.deviceInfo,
        isActive: session.isActive,
        createdAt: session.createdAt,
        lastAccessedAt: session.lastAccessedAt
      }));

      const response: ApiResponse = {
        success: true,
        data: { sessions: sanitizedSessions },
        message: 'Active sessions retrieved successfully',
        timestamp: new Date().toISOString()
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response, null, 2));
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve sessions');
    }
  };

  revokeSession = async (req: AuthenticatedRequest, res: ServerResponse): Promise<void> => {
    try {
      if (!req.user) {
        this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
        return;
      }

      const sessionId = req.params?.sessionId;
      if (!sessionId) {
        this.handleError(res, new Error('Session ID required'), 'Session ID is required', 400);
        return;
      }

      await authService.revokeSession(sessionId);

      const response: ApiResponse = {
        success: true,
        message: 'Session revoked successfully',
        timestamp: new Date().toISOString()
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response, null, 2));
    } catch (error) {
      this.handleError(res, error, 'Failed to revoke session');
    }
  };

  revokeAllSessions = async (req: AuthenticatedRequest, res: ServerResponse): Promise<void> => {
    try {
      if (!req.user) {
        this.handleError(res, new Error('User not authenticated'), 'Authentication required', 401);
        return;
      }

      await authService.revokeAllSessions(req.user.userId);

      const response: ApiResponse = {
        success: true,
        message: 'All sessions revoked successfully',
        timestamp: new Date().toISOString()
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response, null, 2));
    } catch (error) {
      this.handleError(res, error, 'Failed to revoke all sessions');
    }
  };



  async registerStepOne(req: AuthenticatedRequest, res: ServerResponse): Promise<void> {
    try {

      // console.log(" +++++++++++++++++++++++++++++++++ ");
      // console.log(req.body);
      // console.log(" +++++++++++++++++++++++++++++++++ ");

      const response = await authService.registerStepOne(req.body);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response, null, 2));
    } catch (error) {
      this.handleError(res, error, 'Failed to revoke all sessions');
    }
  }

  async registerStepTwo(req: AuthenticatedRequest, res: ServerResponse): Promise<void> {
    try {
      const result = await authService.registerStepTwo(req.body);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result, null, 2));
    } catch (error) {
      this.handleError(res, error, 'Failed to revoke all sessions');
    }
  }

  async registerStepThree(req: AuthenticatedRequest, res: ServerResponse): Promise<void> {
    try {
      const result = await authService.registerStepThree(req.body);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result, null, 2));
    } catch (error) {
      this.handleError(res, error, 'Failed to revoke all sessions');
    }
  }

  async resendOtp(req: AuthenticatedRequest, res: ServerResponse): Promise<void> {
    try {
      const result = await authService.resendOtp(req.body.email);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result, null, 2));
    } catch (error) {
      this.handleError(res, error, 'Failed to revoke all sessions');
    }
  }

  async forgotPasswordStepOne(req: AuthenticatedRequest, res: ServerResponse): Promise<void> {
    try {
      const result = await authService.forgotPasswordStepOne(req.body);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result, null, 2));
    } catch (error) {
      this.handleError(res, error, 'Failed to revoke all sessions');
    }
  }

  async forgotPasswordStepTwo(req: AuthenticatedRequest, res: ServerResponse): Promise<void> {
    try {
      const result = await authService.forgotPasswordStepTwo(req.body);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result, null, 2));
    } catch (error) {
      this.handleError(res, error, 'Failed to revoke all sessions');
    }
  }

  async forgotPasswordStepThree(req: AuthenticatedRequest, res: ServerResponse): Promise<void> {
    try {
      const result = await authService.forgotPasswordStepThree(req.body);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result, null, 2));
    } catch (error) {
      this.handleError(res, error, 'Failed to revoke all sessions');
    }
  }

  async resendPasswordResetOtp(req: AuthenticatedRequest, res: ServerResponse): Promise<void> {
    try {
      const result = await authService.resendPasswordResetOtp(req.body.email);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result, null, 2));
    } catch (error) {
      this.handleError(res, error, 'Failed to revoke all sessions');
    }
  }

  private handleError(res: ServerResponse, error: unknown, defaultMessage: string, statusCode = 500): void {
    const message = error instanceof Error ? error.message : defaultMessage;

    const response: ApiResponse = {
      success: false,
      error: defaultMessage,
      message,
      timestamp: new Date().toISOString()
    };

    console.error(`[AuthController] ${defaultMessage}:`, error);

    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response, null, 2));
  }
}

const authController = new AuthController();
export default authController;