import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardEndpoint } from '@/api/endpoints/dashboard.endpoint';
import {

  UserFilters,
  TimeRange,

} from '@/types/dashboard.types';

// ============= Dashboard Statistics Hook =============

export function useRoleDashboardStats() {
  return useQuery({
    queryKey: ['role-dashboard-stats'],
    queryFn: () => dashboardEndpoint.getDashboardStats(),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider stale after 2 minutes
  });
}

// ============= System Health Hook =============

export function useSystemHealth() {
  return useQuery({
    queryKey: ['system-health'],
    queryFn: () => dashboardEndpoint.getSystemHealth(),
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
    staleTime: 1 * 60 * 1000, // Consider stale after 1 minute
  });
}

// ============= User Management Hooks =============

export function useUserManagement(
  filters?: UserFilters,
  page: number = 1,
  pageSize: number = 20
) {
  return useQuery({
    queryKey: ['user-management', filters, page, pageSize],
    queryFn: () => dashboardEndpoint.getUserManagement(filters, page, pageSize),
    staleTime: 1 * 60 * 1000, // Consider stale after 1 minute
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      role,
      permissions,
    }: {
      userId: string;
      role: string;
      permissions?: string[];
    }) => dashboardEndpoint.updateUserRole(userId, role, permissions),
    onSuccess: () => {
      // Invalidate user management queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['user-management'] });
      queryClient.invalidateQueries({ queryKey: ['role-dashboard-stats'] });
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      isActive,
      isLocked,
    }: {
      userId: string;
      isActive?: boolean;
      isLocked?: boolean;
    }) => dashboardEndpoint.updateUserStatus(userId, isActive, isLocked),
    onSuccess: () => {
      // Invalidate user management queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['user-management'] });
      queryClient.invalidateQueries({ queryKey: ['role-dashboard-stats'] });
    },
  });
}

export function useBulkUserAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userIds,
      action,
    }: {
      userIds: string[];
      action: 'activate' | 'deactivate' | 'lock' | 'unlock' | 'delete';
    }) => dashboardEndpoint.bulkUserAction(userIds, action),
    onSuccess: () => {
      // Invalidate user management queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['user-management'] });
      queryClient.invalidateQueries({ queryKey: ['role-dashboard-stats'] });
    },
  });
}

// ============= Analytics Hook =============

export function useAnalytics(timeRange?: TimeRange) {
  return useQuery({
    queryKey: ['analytics', timeRange],
    queryFn: () => dashboardEndpoint.getAnalytics(timeRange),
    staleTime: 5 * 60 * 1000, // Consider stale after 5 minutes
    enabled: !!timeRange, // Only fetch if timeRange is provided
  });
}

// ============= Composite Dashboard Hook =============

/**
 * Composite hook that fetches all dashboard data based on user role
 * Use this for the main dashboard views
 */
export function useDashboardData(userRole: string) {
  const stats = useRoleDashboardStats();
  const systemHealth = useSystemHealth();

  // Determine which data to fetch based on role
  const isSuperAdmin = userRole === 'super_admin';
  const isAdmin = userRole === 'admin' || isSuperAdmin;

  return {
    stats: stats.data,
    systemHealth: isSuperAdmin ? systemHealth.data : undefined,
    isLoading: stats.isLoading || (isSuperAdmin && systemHealth.isLoading),
    isError: stats.isError || (isSuperAdmin && systemHealth.isError),
    error: stats.error || systemHealth.error,
    refetch: () => {
      stats.refetch();
      if (isSuperAdmin) {
        systemHealth.refetch();
      }
    },
  };
}
