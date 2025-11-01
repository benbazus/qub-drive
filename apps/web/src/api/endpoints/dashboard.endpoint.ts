import { apiClient } from '../api.client';
import {
  DashboardStats,
  SystemHealth,
  UserManagementData,
  UserListItem,
  UserFilters,
  UpdateUserRoleRequest,
  UpdateUserStatusRequest,
  BulkUserActionRequest,
  AnalyticsData,
  TimeRange,
} from '../../types/dashboard.types';

class DashboardEndpoint {
  private readonly endpoints = {
    stats: '/dashboard/stats',
    systemHealth: '/dashboard/system-health',
    users: '/dashboard/users',
    userRole: (userId: string) => `/dashboard/users/${userId}/role`,
    userStatus: (userId: string) => `/dashboard/users/${userId}/status`,
    bulkAction: '/dashboard/users/bulk-action',
    analytics: '/dashboard/analytics',
  };

  /**
   * Get dashboard statistics based on user role
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await apiClient.get<{ success: boolean; data: DashboardStats }>(
      this.endpoints.stats
    );
    if (response.error || !response.data?.success || !response.data?.data) {
      throw new Error(response.error || 'Failed to get dashboard statistics');
    }
    return response.data.data;
  }

  /**
   * Get system health information (Super Admin only)
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const response = await apiClient.get<{ success: boolean; data: SystemHealth }>(
      this.endpoints.systemHealth
    );
    if (response.error || !response.data?.success || !response.data?.data) {
      throw new Error(response.error || 'Failed to get system health');
    }
    return response.data.data;
  }

  /**
   * Get user management data with pagination and filters
   */
  async getUserManagement(
    filters?: UserFilters,
    page: number = 1,
    pageSize: number = 20
  ): Promise<UserManagementData> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());

    if (filters) {
      if (filters.role) params.append('role', filters.role);
      if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
      if (filters.isVerified !== undefined) params.append('isVerified', filters.isVerified.toString());
      if (filters.isLocked !== undefined) params.append('isLocked', filters.isLocked.toString());
      if (filters.searchQuery) params.append('searchQuery', filters.searchQuery);
    }

    const response = await apiClient.get<{ success: boolean; data: UserManagementData }>(
      `${this.endpoints.users}?${params.toString()}`
    );
    if (response.error || !response.data?.success || !response.data?.data) {
      throw new Error(response.error || 'Failed to get user management data');
    }
    return response.data.data;
  }

  /**
   * Update user role and permissions (Admin/Super Admin only)
   */
  async updateUserRole(userId: string, role: string, permissions?: string[]): Promise<UserListItem> {
    const request: UpdateUserRoleRequest = {
      userId,
      role,
      permissions,
    };

    const response = await apiClient.put<{ success: boolean; data: UserListItem }>(
      this.endpoints.userRole(userId),
      request
    );
    if (response.error || !response.data?.success || !response.data?.data) {
      throw new Error(response.error || 'Failed to update user role');
    }
    return response.data.data;
  }

  /**
   * Update user status (active/locked)
   */
  async updateUserStatus(
    userId: string,
    isActive?: boolean,
    isLocked?: boolean
  ): Promise<UserListItem> {
    const request: UpdateUserStatusRequest = {
      userId,
      isActive,
      isLocked,
    };

    const response = await apiClient.put<{ success: boolean; data: UserListItem }>(
      this.endpoints.userStatus(userId),
      request
    );
    if (response.error || !response.data?.success || !response.data?.data) {
      throw new Error(response.error || 'Failed to update user status');
    }
    return response.data.data;
  }

  /**
   * Perform bulk action on multiple users
   */
  async bulkUserAction(
    userIds: string[],
    action: 'activate' | 'deactivate' | 'lock' | 'unlock' | 'delete'
  ): Promise<{ affected: number }> {
    const request: BulkUserActionRequest = {
      userIds,
      action,
    };

    const response = await apiClient.post<{ success: boolean; data: { affected: number } }>(
      this.endpoints.bulkAction,
      request
    );
    if (response.error || !response.data?.success || !response.data?.data) {
      throw new Error(response.error || 'Failed to perform bulk action');
    }
    return response.data.data;
  }

  /**
   * Get analytics data
   */
  async getAnalytics(timeRange?: TimeRange): Promise<AnalyticsData> {
    const params = new URLSearchParams();

    if (timeRange) {
      params.append('start', timeRange.start);
      params.append('end', timeRange.end);
      params.append('period', timeRange.period);
    }

    const response = await apiClient.get<{ success: boolean; data: AnalyticsData }>(
      `${this.endpoints.analytics}?${params.toString()}`
    );
    if (response.error || !response.data?.success || !response.data?.data) {
      throw new Error(response.error || 'Failed to get analytics data');
    }
    return response.data.data;
  }
}

// Create and export singleton instance
export const dashboardEndpoint = new DashboardEndpoint();
export default dashboardEndpoint;
