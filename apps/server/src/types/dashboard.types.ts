import { UserRole, Permission } from './auth.types';

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
  usersByRole: Record<UserRole, number>;
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
    uploadedAt: Date;
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
  activityType: ActivityType;
  description: string;
  resourceType?: string;
  resourceId?: string;
  resourceName?: string;
  ipAddress?: string;
  deviceInfo?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export enum ActivityType {
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  USER_ROLE_CHANGED = 'user_role_changed',
  FILE_UPLOADED = 'file_uploaded',
  FILE_DOWNLOADED = 'file_downloaded',
  FILE_SHARED = 'file_shared',
  FILE_DELETED = 'file_deleted',
  FILE_MOVED = 'file_moved',
  FILE_RENAMED = 'file_renamed',
  FOLDER_CREATED = 'folder_created',
  FOLDER_DELETED = 'folder_deleted',
  SETTINGS_UPDATED = 'settings_updated',
  PASSWORD_CHANGED = 'password_changed',
  PASSWORD_RESET = 'password_reset',
  TWO_FACTOR_ENABLED = 'two_factor_enabled',
  TWO_FACTOR_DISABLED = 'two_factor_disabled',
}

export interface SecurityEventLog {
  id: string;
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  userId?: string;
  userEmail?: string;
  fullName?: string;
  ipAddress?: string;
  deviceInfo?: string;
  action: string;
  outcome: SecurityOutcome;
  riskScore?: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export enum SecurityEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',
  ACCOUNT_LOCKED = 'account_locked',
  ACCOUNT_UNLOCKED = 'account_unlocked',
  PASSWORD_CHANGED = 'password_changed',
  PASSWORD_RESET_REQUESTED = 'password_reset_requested',
  PASSWORD_RESET_COMPLETED = 'password_reset_completed',
  TWO_FACTOR_ENABLED = 'two_factor_enabled',
  TWO_FACTOR_DISABLED = 'two_factor_disabled',
  TWO_FACTOR_FAILED = 'two_factor_failed',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  PERMISSION_DENIED = 'permission_denied',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  DATA_BREACH_ATTEMPT = 'data_breach_attempt',
  MALWARE_DETECTED = 'malware_detected',
}

export enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum SecurityOutcome {
  SUCCESS = 'success',
  FAILURE = 'failure',
  BLOCKED = 'blocked',
  PENDING = 'pending',
}

// ============= System Health Types =============

export interface SystemHealth {
  status: SystemStatus;
  uptime: number;
  serverInfo: ServerInfo;
  database: DatabaseHealth;
  services: ServiceHealth[];
  performance: PerformanceMetrics;
  resources: ResourceUsage;
  lastChecked: Date;
}

export enum SystemStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  DOWN = 'down',
  MAINTENANCE = 'maintenance',
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
  lastBackup?: Date;
}

export interface ServiceHealth {
  name: string;
  status: 'online' | 'offline' | 'degraded';
  responseTime?: number;
  lastChecked: Date;
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
  filters: UserFilters;
}

export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
  isEmailVerified: boolean;
  isLocked: boolean;
  twoFactorEnabled: boolean;
  storageUsed: number;
  storageLimit: number;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserFilters {
  role?: UserRole;
  isActive?: boolean;
  isVerified?: boolean;
  isLocked?: boolean;
  searchQuery?: string;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface UpdateUserRoleRequest {
  userId: string;
  role: UserRole;
  permissions?: Permission[];
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
  timestamp: Date;
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
  reportType: ReportType;
  timeRange: TimeRange;
  format: ReportFormat;
  filters?: Record<string, any>;
  includeCharts?: boolean;
}

export enum ReportType {
  USER_ACTIVITY = 'user_activity',
  STORAGE_USAGE = 'storage_usage',
  SECURITY_AUDIT = 'security_audit',
  SYSTEM_PERFORMANCE = 'system_performance',
  COMPLIANCE = 'compliance',
  CUSTOM = 'custom',
}

export enum ReportFormat {
  PDF = 'pdf',
  CSV = 'csv',
  EXCEL = 'excel',
  JSON = 'json',
}

export interface GeneratedReport {
  id: string;
  reportType: ReportType;
  format: ReportFormat;
  fileName: string;
  fileSize: number;
  generatedBy: string;
  generatedAt: Date;
  downloadUrl: string;
  expiresAt?: Date;
}

// ============= Request/Response Types =============

export interface GetDashboardStatsRequest {
  role: UserRole;
  timeRange?: TimeRange;
}

export interface GetActivityLogsRequest {
  userId?: string;
  activityType?: ActivityType;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}

export interface GetAuditLogsRequest {
  userId?: string;
  eventType?: SecurityEventType;
  severity?: SecuritySeverity;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}

export interface DashboardResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: Date;
}
