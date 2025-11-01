import { Response } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { ApiResponse, AuthenticatedRequest } from '../middleware/auth.middleware';
import {
  DashboardStats,
  SystemHealth,
  UserManagementData,
  UserFilters,
  UpdateUserRoleRequest,
  UpdateUserStatusRequest,
  BulkUserActionRequest,
  AnalyticsData,
  TimeRange,

} from '../types/dashboard.types';
import { UserRole } from '@/types/auth.types';

export class DashboardController {
  private dashboardService: DashboardService;

  constructor() {
    this.dashboardService = new DashboardService();
  }

  /**
   * Get dashboard statistics based on user role
   * GET /api/dashboard/stats
   */
  async getDashboardStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;

      const stats = await this.dashboardService.getDashboardStats(userId, role);

      const response: ApiResponse<DashboardStats> = {
        success: true,
        data: stats,
      };

      res.status(200).json(response);
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve dashboard statistics');
    }
  }

  /**
   * Get system health information (Super Admin only)
   * GET /api/dashboard/system-health
   */
  async getSystemHealth(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const health = await this.dashboardService.getSystemHealth();

      const response: ApiResponse<SystemHealth> = {
        success: true,
        data: health,
      };

      res.status(200).json(response);
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve system health');
    }
  }

  /**
   * Get user management data with pagination and filters
   * GET /api/dashboard/users
   */
  async getUserManagement(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;

      const filters: UserFilters = {
        role: req.query.role as UserRole | undefined,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        isVerified: req.query.isVerified === 'true' ? true : req.query.isVerified === 'false' ? false : undefined,
        isLocked: req.query.isLocked === 'true' ? true : req.query.isLocked === 'false' ? false : undefined,
        searchQuery: req.query.searchQuery as string,
      };

      const data = await this.dashboardService.getUserManagement(filters, page, pageSize);

      const response: ApiResponse<UserManagementData> = {
        success: true,
        data,
      };

      res.status(200).json(response);
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve user management data');
    }
  }

  /**
   * Update user role and permissions (Admin/Super Admin only)
   * PUT /api/dashboard/users/:userId/role
   */
  async updateUserRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { role, permissions } = req.body;

      if (!role) {
        const response: ApiResponse<null> = {
          success: false,
          data: null,
          error: 'Role is required',
          message: 'Role is required',
        };
        res.status(400).json(response);
        return;
      }

      const request: UpdateUserRoleRequest = {
        userId,
        role,
        permissions,
      };

      const updatedUser = await this.dashboardService.updateUserRole(request);

      const response: ApiResponse<typeof updatedUser> = {
        success: true,
        data: updatedUser,
        message: 'User role updated successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      this.handleError(res, error, 'Failed to update user role');
    }
  }

  /**
   * Update user status (active/locked)
   * PUT /api/dashboard/users/:userId/status
   */
  async updateUserStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { isActive, isLocked } = req.body;

      const request: UpdateUserStatusRequest = {
        userId,
        isActive,
        isLocked,
      };

      const updatedUser = await this.dashboardService.updateUserStatus(request);

      const response: ApiResponse<typeof updatedUser> = {
        success: true,
        data: updatedUser,
        message: 'User status updated successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      this.handleError(res, error, 'Failed to update user status');
    }
  }

  /**
   * Perform bulk action on multiple users
   * POST /api/dashboard/users/bulk-action
   */
  async bulkUserAction(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userIds, action } = req.body;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        const response: ApiResponse<null> = {
          success: false,
          data: null,
          error: 'userIds array is required',
          message: 'userIds array is required',
        };
        res.status(400).json(response);
        return;
      }

      if (!action || !['activate', 'deactivate', 'lock', 'unlock', 'delete'].includes(action)) {
        const response: ApiResponse<null> = {
          success: false,
          data: null,
          error: 'Invalid action',
          message: 'Action must be one of: activate, deactivate, lock, unlock, delete',
        };
        res.status(400).json(response);
        return;
      }

      const request: BulkUserActionRequest = {
        userIds,
        action,
      };

      const result = await this.dashboardService.bulkUserAction(request);

      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
        message: `Bulk action '${action}' performed on ${result.affected} users`,
      };

      res.status(200).json(response);
    } catch (error) {
      this.handleError(res, error, 'Failed to perform bulk user action');
    }
  }

  /**
   * Get analytics data
   * GET /api/dashboard/analytics
   */
  async getAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const timeRange: TimeRange = {
        start: req.query.start as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: req.query.end as string || new Date().toISOString(),
        period: (req.query.period as any) || 'day',
      };

      const analytics = await this.dashboardService.getAnalytics(timeRange);

      const response: ApiResponse<AnalyticsData> = {
        success: true,
        data: analytics,
      };

      res.status(200).json(response);
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve analytics data');
    }
  }

  /**
   * Error handler
   */
  private handleError(res: Response, error: any, defaultMessage: string): void {
    console.error(defaultMessage, error);

    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : defaultMessage,
      message: defaultMessage,
    };

    res.status(500).json(response);
  }
}

export default new DashboardController();
