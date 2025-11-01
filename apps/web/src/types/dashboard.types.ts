// ============= Dashboard Statistics Types =============

export interface DashboardStats {
  users: UserStats;
  storage: StorageStats;
  activity: ActivityStats;
  security: SecurityStats;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  usersByRole: Record<string, number>;
  verifiedUsers: number;
  unverifiedUsers: number;
  lockedUsers: number;
}

export interface StorageStats {
  totalStorage: number;
  usedStorage: number;
  availableStorage: number;
  storageByUser: Array<{
    userId: string;
    email: string;
    fullName: string;
    storageUsed: number;
    storageLimit: number;
    percentageUsed: number;
  }>;
  totalFiles: number;
  totalFolders: number;
  filesByType: Record<string, number>;
  averageFileSize: number;
  largestFiles: Array<{
    fileId: string;
    fileName: string;
    fileSize: number;
    owner: string;
    uploadedAt: string;
  }>;
}

export interface ActivityStats {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  totalLogins: number;
  loginsToday: number;
  loginsThisWeek: number;
  loginsThisMonth: number;
  totalUploads: number;
  uploadsToday: number;
  uploadsThisWeek: number;
  totalDownloads: number;
  downloadsToday: number;
  downloadsThisWeek: number;
  totalShares: number;
  sharesToday: number;
  sharesThisWeek: number;
  recentActivity: ActivityLog[];
}

export interface SecurityStats {
  failedLoginAttempts: number;
  failedLoginsToday: number;
  failedLoginsThisWeek: number;
  suspiciousActivities: number;
  suspiciousActivitiesToday: number;
  lockedAccounts: number;
  twoFactorEnabledUsers: number;
  twoFactorPercentage: number;
  recentSecurityEvents: SecurityEventLog[];
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
}

// ============= Activity & Audit Log Types =============

export interface ActivityLog {
  id: string;
  userId: string;
  userEmail: string;
  fullName: string;
  activityType: string;
  description: string;
  resourceType?: string;
  resourceId?: string;
  resourceName?: string;
  ipAddress?: string;
  deviceInfo?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface SecurityEventLog {
  id: string;
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  userEmail?: string;
  fullName?: string;
  ipAddress?: string;
  deviceInfo?: string;
  action: string;
  outcome: 'success' | 'failure' | 'blocked' | 'pending';
  riskScore?: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

// ============= System Health Types =============

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down' | 'maintenance';
  uptime: number;
  serverInfo: ServerInfo;
  database: DatabaseHealth;
  services: ServiceHealth[];
  performance: PerformanceMetrics;
  resources: ResourceUsage;
  lastChecked: string;
}

export interface ServerInfo {
  nodeVersion: string;
  platform: string;
  architecture: string;
  totalMemory: number;
  freeMemory: number;
  cpuCount: number;
  hostname: string;
  environment: string;
}

export interface DatabaseHealth {
  status: 'connected' | 'disconnected' | 'error';
  responseTime: number;
  activeConnections: number;
  maxConnections: number;
  databaseSize: number;
  lastBackup?: string;
}

export interface ServiceHealth {
  name: string;
  status: 'online' | 'offline' | 'degraded';
  responseTime?: number;
  lastChecked: string;
  errorMessage?: string;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  requestsPerMinute: number;
  errorRate: number;
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    free: number;
    percentage: number;
  };
  disk: {
    used: number;
    free: number;
    percentage: number;
  };
}

export interface ResourceUsage {
  cpu: number;
  memory: number;
  disk: number;
  network: {
    bytesReceived: number;
    bytesSent: number;
  };
}

// ============= User Management Types =============

export interface UserManagementData {
  users: UserListItem[];
  pagination: PaginationInfo;
}

export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  isEmailVerified: boolean;
  isLocked: boolean;
  twoFactorEnabled: boolean;
  storageUsed: number;
  storageLimit: number;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface UserFilters {
  role?: string;
  isActive?: boolean;
  isVerified?: boolean;
  isLocked?: boolean;
  searchQuery?: string;
}

export interface UpdateUserRoleRequest {
  userId: string;
  role: string;
  permissions?: string[];
}

export interface UpdateUserStatusRequest {
  userId: string;
  isActive?: boolean;
  isLocked?: boolean;
}

export interface BulkUserActionRequest {
  userIds: string[];
  action: 'activate' | 'deactivate' | 'lock' | 'unlock' | 'delete';
}

// ============= Analytics Types =============

export interface AnalyticsData {
  timeRange: TimeRange;
  userGrowth: TimeSeriesData[];
  storageGrowth: TimeSeriesData[];
  activityTrends: TimeSeriesData[];
  topUsers: TopUserData[];
  topFiles: TopFileData[];
  geographicData: GeographicData[];
}

export interface TimeRange {
  start: string;
  end: string;
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export interface TimeSeriesData {
  timestamp: string;
  value: number;
  label?: string;
}

export interface TopUserData {
  userId: string;
  email: string;
  fullName: string;
  metric: string;
  value: number;
  rank: number;
}

export interface TopFileData {
  fileId: string;
  fileName: string;
  fileType: string;
  owner: string;
  metric: string;
  value: number;
  rank: number;
}

export interface GeographicData {
  country: string;
  countryCode: string;
  users: number;
  uploads: number;
  downloads: number;
}

// ============= Reports Types =============

export interface ReportConfig {
  reportType: 'user_activity' | 'storage_usage' | 'security_audit' | 'system_performance' | 'compliance' | 'custom';
  timeRange: TimeRange;
  format: 'pdf' | 'csv' | 'excel' | 'json';
  filters?: Record<string, any>;
  includeCharts?: boolean;
}

export interface GeneratedReport {
  id: string;
  reportType: string;
  format: string;
  fileName: string;
  fileSize: number;
  generatedBy: string;
  generatedAt: string;
  downloadUrl: string;
  expiresAt?: string;
}

// ============= Dashboard Card Props =============

export interface DashboardCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  loading?: boolean;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
}
