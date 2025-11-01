import { apiClient } from '../api.client';

// Type definitions
export interface SystemSettings {
  id: number;
  systemVersion: string;
  maintenanceMode: boolean;
  maintenanceMessage?: string;

  // Storage & File Management
  defaultMaxStorage: bigint;
  maxFileSize: bigint;
  allowedFileTypes: string[];
  defaultStoragePath: string;
  storageQuotaWarningThreshold: number;
  enableFileVersioning: boolean;
  maxVersionsPerFile: number;
  autoDeleteOldVersions: boolean;
  fileRetentionDays: number;
  enableFileCompression: boolean;
  compressionLevel: number;
  enableDuplicateDetection: boolean;

  // Email Settings
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_SECURE: boolean;
  SMTP_FROM?: string;
  SMTP_FROM_NAME?: string;
  COMPANY_NAME?: string;
  SUPPORT_EMAIL?: string;

  // Security & Access Control
  enableTwoFactorAuth: boolean;
  passwordMinLength: number;
  passwordRequireSpecialChars: boolean;
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
  enableIpWhitelist: boolean;
  allowedIpRanges: string[];
  enableEncryptionAtRest: boolean;
  encryptionAlgorithm: string;
  enableAuditLogging: boolean;
  enableThreatDetection: boolean;
  enableSecurityScanning: boolean;
  securityScanFrequency: string;

  // Sharing & Collaboration
  enablePublicSharing: boolean;
  enablePasswordProtectedSharing: boolean;
  defaultShareExpiration: number;
  maxShareExpiration: number;
  enableDownloadTracking: boolean;
  enableCollaborativeEditing: boolean;
  maxCollaboratorsPerFile: number;
  enableComments: boolean;
  enableFilePreview: boolean;
  previewableFileTypes: string[];

  // Compliance & Legal
  enableGdprCompliance: boolean;
  dataRetentionPolicyDays: number;
  enableRightToBeForgotten: boolean;
  enableDataPortability: boolean;
  complianceReportingEnabled: boolean;
  enableDataClassification: boolean;
  dataClassificationLevels: string[];

  createdAt: Date;
  updatedAt: Date;
  lastBackupAt?: Date;
}

export interface SystemSettingsUpdate {
  // Storage & File Management
  defaultMaxStorage?: string; // Will be converted to BigInt on backend
  maxFileSize?: string; // Will be converted to BigInt on backend
  allowedFileTypes?: string[];
  defaultStoragePath?: string;
  storageQuotaWarningThreshold?: number;
  enableFileVersioning?: boolean;
  maxVersionsPerFile?: number;
  autoDeleteOldVersions?: boolean;
  fileRetentionDays?: number;
  enableFileCompression?: boolean;
  compressionLevel?: number;
  enableDuplicateDetection?: boolean;

  // Email Settings
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_SECURE?: boolean;
  SMTP_FROM?: string;
  SMTP_FROM_NAME?: string;
  COMPANY_NAME?: string;
  SUPPORT_EMAIL?: string;

  // Security & Access Control
  enableTwoFactorAuth?: boolean;
  passwordMinLength?: number;
  passwordRequireSpecialChars?: boolean;
  sessionTimeoutMinutes?: number;
  maxLoginAttempts?: number;
  lockoutDurationMinutes?: number;
  enableIpWhitelist?: boolean;
  allowedIpRanges?: string[];
  enableEncryptionAtRest?: boolean;
  encryptionAlgorithm?: string;
  enableAuditLogging?: boolean;
  enableThreatDetection?: boolean;
  enableSecurityScanning?: boolean;
  securityScanFrequency?: string;

  // Sharing & Collaboration
  enablePublicSharing?: boolean;
  enablePasswordProtectedSharing?: boolean;
  defaultShareExpiration?: number;
  maxShareExpiration?: number;
  enableDownloadTracking?: boolean;
  enableCollaborativeEditing?: boolean;
  maxCollaboratorsPerFile?: number;
  enableComments?: boolean;
  enableFilePreview?: boolean;
  previewableFileTypes?: string[];

  // Compliance & Legal
  enableGdprCompliance?: boolean;
  dataRetentionPolicyDays?: number;
  enableRightToBeForgotten?: boolean;
  enableDataPortability?: boolean;
  complianceReportingEnabled?: boolean;
  enableDataClassification?: boolean;
  dataClassificationLevels?: string[];
}

export interface SystemInfo {
  version: string;
  uptime: number;
  totalUsers: number;
  totalFiles: number;
  storageUsed: string; // BigInt as string
  lastBackup?: Date;
  licenseType: string;
  licenseExpiration: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailTestResult {
  success: boolean;
  error?: string;
}

class SystemSettingsEndpoint {
  private readonly endpoints = {
    settings: '/settings',
    settingsByCategory: (category: string) => `/settings/${category}`,
    reset: '/settings/reset',
    testEmail: '/settings/email/test',
    systemInfo: '/settings/info',
  };

  async getSettings(): Promise<SystemSettings> {
    const response = await apiClient.get<{ success: boolean; data: SystemSettings }>(this.endpoints.settings);
    if (response.error || !response.data?.success || !response.data?.data) {
      throw new Error(response.error || 'Failed to get system settings');
    }
    return response.data.data;
  }

  async updateSettings(updates: SystemSettingsUpdate): Promise<SystemSettings> {
    const response = await apiClient.put<{ success: boolean; data: SystemSettings }>(
      this.endpoints.settings,
      updates
    );
    if (response.error || !response.data?.success || !response.data?.data) {
      throw new Error(response.error || 'Failed to update system settings');
    }
    return response.data.data;
  }

  async getSettingsByCategory(category: 'storage' | 'email' | 'security' | 'sharing' | 'compliance'): Promise<Partial<SystemSettings>> {
    const response = await apiClient.get<{ success: boolean; data: Partial<SystemSettings> }>(
      this.endpoints.settingsByCategory(category)
    );
    if (response.error || !response.data?.success || !response.data?.data) {
      throw new Error(response.error || 'Failed to get settings by category');
    }
    return response.data.data;
  }

  async updateSettingsByCategory(
    category: 'storage' | 'email' | 'security' | 'sharing' | 'compliance',
    updates: Partial<SystemSettingsUpdate>
  ): Promise<Partial<SystemSettings>> {
    const response = await apiClient.put<{ success: boolean; data: Partial<SystemSettings> }>(
      this.endpoints.settingsByCategory(category),
      updates
    );
    if (response.error || !response.data?.success || !response.data?.data) {
      throw new Error(response.error || 'Failed to update settings by category');
    }
    return response.data.data;
  }

  async resetToDefaults(): Promise<SystemSettings> {
    const response = await apiClient.post<{ success: boolean; data: SystemSettings }>(this.endpoints.reset);
    if (response.error || !response.data?.success || !response.data?.data) {
      throw new Error(response.error || 'Failed to reset settings to defaults');
    }
    return response.data.data;
  }

  async testEmailSettings(emailSettings: Partial<SystemSettingsUpdate>): Promise<EmailTestResult> {
    const response = await apiClient.post<{ success: boolean; data: EmailTestResult }>(
      this.endpoints.testEmail,
      emailSettings
    );
    if (response.error || !response.data?.data) {
      throw new Error(response.error || 'Failed to test email settings');
    }
    return response.data.data;
  }

  async getSystemInfo(): Promise<SystemInfo> {
    const response = await apiClient.get<{ success: boolean; data: SystemInfo }>(this.endpoints.systemInfo);
    if (response.error || !response.data?.success || !response.data?.data) {
      throw new Error(response.error || 'Failed to get system information');
    }
    return response.data.data;
  }
}

// Create and export singleton instance
export const systemSettingsEndpoint = new SystemSettingsEndpoint();
export default systemSettingsEndpoint;