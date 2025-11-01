import prisma from "../config/database.config";
import { SystemSettings } from "@prisma/client";

export interface SystemSettingsUpdate {
  // Storage & File Management
  defaultMaxStorage?: bigint;
  maxFileSize?: bigint;
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

  // Virus & Malware Protection
  enableVirusScanning?: boolean;
  virusScanningProvider?: string;
  quarantineInfectedFiles?: boolean;
  virusScanOnUpload?: boolean;
  virusScanSchedule?: string;

  // Content Analysis & AI
  enableContentModeration?: boolean;
  contentModerationProvider?: string;
  enableOcrProcessing?: boolean;
  ocrProvider?: string;
  enableThumbnailGeneration?: boolean;
  thumbnailQuality?: number;
  enableWatermarking?: boolean;
  watermarkText?: string;
  watermarkOpacity?: number;

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

  // Advanced Security Settings
  enableSsoIntegration?: boolean;
  ssoProvider?: string;
  ssoMetadataUrl?: string;
  enableLdapIntegration?: boolean;
  ldapServerUrl?: string;
  ldapBaseDn?: string;
  ldapBindDn?: string;
  ldapBindPassword?: string;

  // Monitoring & Analytics
  enableAnalytics?: boolean;
  analyticsProvider?: string;
  enableUsageReporting?: boolean;
  reportingFrequency?: string;
  enableExportReports?: boolean;
  retentionDays?: number;
  enableGeolocation?: boolean;
  enableRealTimeMonitoring?: boolean;
  enableAlertSystem?: boolean;
  alertThresholds?: any;
  alertRecipients?: string[];

  // Compliance & Legal
  enableGdprCompliance?: boolean;
  dataRetentionPolicyDays?: number;
  enableRightToBeForgotten?: boolean;
  enableDataPortability?: boolean;
  complianceReportingEnabled?: boolean;
  enableDataClassification?: boolean;
  dataClassificationLevels?: string[];
}

export class SystemSettingsService {
  async getSettings(): Promise<SystemSettings> {
    let settings = await prisma.systemSettings.findFirst({
      where: { id: 1 }
    });

    if (!settings) {
      // Create default settings if none exist
      settings = await prisma.systemSettings.create({
        data: { id: 1 }
      });
    }

    return settings;
  }

  async updateSettings(updates: SystemSettingsUpdate): Promise<SystemSettings> {
    // Ensure settings record exists
    await this.getSettings();

    const updatedSettings = await prisma.systemSettings.update({
      where: { id: 1 },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    });

    return updatedSettings;
  }

  async resetToDefaults(): Promise<SystemSettings> {
    // Delete existing settings and create new default ones
    await prisma.systemSettings.deleteMany({});

    const defaultSettings = await prisma.systemSettings.create({
      data: { id: 1 }
    });

    return defaultSettings;
  }

  async getSettingsByCategory(category: string): Promise<Partial<SystemSettings>> {
    const settings = await this.getSettings();

    switch (category) {
      case 'storage':
        return {
          defaultMaxStorage: settings.defaultMaxStorage,
          maxFileSize: settings.maxFileSize,
          allowedFileTypes: settings.allowedFileTypes,
          defaultStoragePath: settings.defaultStoragePath,
          storageQuotaWarningThreshold: settings.storageQuotaWarningThreshold,
          enableFileVersioning: settings.enableFileVersioning,
          maxVersionsPerFile: settings.maxVersionsPerFile,
          autoDeleteOldVersions: settings.autoDeleteOldVersions,
          fileRetentionDays: settings.fileRetentionDays,
          enableFileCompression: settings.enableFileCompression,
          compressionLevel: settings.compressionLevel,
          enableDuplicateDetection: settings.enableDuplicateDetection
        };

      case 'email':
        return {
          SMTP_HOST: settings.SMTP_HOST,
          SMTP_PORT: settings.SMTP_PORT,
          SMTP_USER: settings.SMTP_USER,
          SMTP_PASS: settings.SMTP_PASS,
          SMTP_SECURE: settings.SMTP_SECURE,
          SMTP_FROM: settings.SMTP_FROM,
          SMTP_FROM_NAME: settings.SMTP_FROM_NAME,
          COMPANY_NAME: settings.COMPANY_NAME,
          SUPPORT_EMAIL: settings.SUPPORT_EMAIL
        };

      case 'security':
        return {
          enableTwoFactorAuth: settings.enableTwoFactorAuth,
          passwordMinLength: settings.passwordMinLength,
          passwordRequireSpecialChars: settings.passwordRequireSpecialChars,
          sessionTimeoutMinutes: settings.sessionTimeoutMinutes,
          maxLoginAttempts: settings.maxLoginAttempts,
          lockoutDurationMinutes: settings.lockoutDurationMinutes,
          enableIpWhitelist: settings.enableIpWhitelist,
          allowedIpRanges: settings.allowedIpRanges,
          enableEncryptionAtRest: settings.enableEncryptionAtRest,
          encryptionAlgorithm: settings.encryptionAlgorithm,
          enableAuditLogging: settings.enableAuditLogging,
          enableThreatDetection: settings.enableThreatDetection,
          enableSecurityScanning: settings.enableSecurityScanning,
          securityScanFrequency: settings.securityScanFrequency
        };

      case 'sharing':
        return {
          enablePublicSharing: settings.enablePublicSharing,
          enablePasswordProtectedSharing: settings.enablePasswordProtectedSharing,
          defaultShareExpiration: settings.defaultShareExpiration,
          maxShareExpiration: settings.maxShareExpiration,
          enableDownloadTracking: settings.enableDownloadTracking,
          enableCollaborativeEditing: settings.enableCollaborativeEditing,
          maxCollaboratorsPerFile: settings.maxCollaboratorsPerFile,
          enableComments: settings.enableComments,
          enableFilePreview: settings.enableFilePreview,
          previewableFileTypes: settings.previewableFileTypes
        };

      case 'compliance':
        return {
          enableGdprCompliance: settings.enableGdprCompliance,
          dataRetentionPolicyDays: settings.dataRetentionPolicyDays,
          enableRightToBeForgotten: settings.enableRightToBeForgotten,
          enableDataPortability: settings.enableDataPortability,
          complianceReportingEnabled: settings.complianceReportingEnabled,
          enableDataClassification: settings.enableDataClassification,
          dataClassificationLevels: settings.dataClassificationLevels
        };

      default:
        return settings;
    }
  }

  async updateSettingsByCategory(category: string, updates: Partial<SystemSettingsUpdate>): Promise<Partial<SystemSettings>> {
    await this.updateSettings(updates);
    return await this.getSettingsByCategory(category);
  }

  async validateEmailSettings(emailSettings: Partial<SystemSettingsUpdate>): Promise<{ valid: boolean; error?: string }> {
    // Basic validation for email settings
    if (emailSettings.SMTP_HOST && !emailSettings.SMTP_PORT) {
      return { valid: false, error: 'SMTP port is required when SMTP host is provided' };
    }

    if (emailSettings.SMTP_FROM && !emailSettings.SMTP_FROM.includes('@')) {
      return { valid: false, error: 'Invalid SMTP FROM email address' };
    }

    if (emailSettings.SUPPORT_EMAIL && !emailSettings.SUPPORT_EMAIL.includes('@')) {
      return { valid: false, error: 'Invalid support email address' };
    }

    return { valid: true };
  }

  async testEmailSettings(emailSettings: Partial<SystemSettingsUpdate>): Promise<{ success: boolean; error?: string }> {
    // This would implement actual email testing
    // For now, return a mock response
    try {
      const validation = await this.validateEmailSettings(emailSettings);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // TODO: Implement actual email testing
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to test email settings' };
    }
  }

  async getSystemInfo(): Promise<{
    version: string;
    uptime: number;
    totalUsers: number;
    totalFiles: number;
    storageUsed: string; // Convert BigInt to string for JSON serialization
    lastBackup?: Date;
    licenseType: string;
    licenseExpiration: Date;
    createdAt: Date;
    updatedAt: Date;
  }> {
    try {
      const settings = await this.getSettings();

      // Get system statistics with error handling
      const [totalUsers, totalFiles, storageStats] = await Promise.allSettled([
        prisma.user.count().catch(() => 0),
        prisma.file.count().catch(() => 0),
        prisma.file.aggregate({
          _sum: { fileSize: true }
        }).catch(() => ({ _sum: { fileSize: BigInt(0) } }))
      ]);

      // Extract values from settled promises
      const totalUsersCount = totalUsers.status === 'fulfilled' ? totalUsers.value : 0;
      const totalFilesCount = totalFiles.status === 'fulfilled' ? totalFiles.value : 0;
      const storageUsedValue = storageStats.status === 'fulfilled'
        ? storageStats.value._sum.fileSize || BigInt(0)
        : BigInt(0);

      return {
        version: settings.systemVersion || '1.0.0',
        uptime: Date.now() - new Date(settings.createdAt).getTime(),
        totalUsers: totalUsersCount,
        totalFiles: totalFilesCount,
        storageUsed: storageUsedValue.toString(), // Convert BigInt to string
        lastBackup: settings.lastBackupAt || undefined,
        licenseType: settings.licenseType || 'enterprise',
        licenseExpiration: settings.licenseExpiration,
        createdAt: settings.createdAt,
        updatedAt: settings.updatedAt
      };
    } catch (error) {
      console.error('Error getting system info:', error);

      // Return safe defaults if there's an error
      return {
        version: '1.0.0',
        uptime: 0,
        totalUsers: 0,
        totalFiles: 0,
        storageUsed: '0',
        licenseType: 'enterprise',
        licenseExpiration: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  }
}