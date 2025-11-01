import prisma from "../config/database.config";
import { UserSettings } from "@prisma/client";

export interface UserSettingsUpdate {
  // Profile settings
  displayName?: string;
  bio?: string;
  company?: string;
  jobTitle?: string;
  location?: string;
  website?: string;
  phoneNumber?: string;

  // Appearance preferences
  theme?: string;
  language?: string;
  timezone?: string;
  dateFormat?: string;
  timeFormat?: string;
  compactMode?: boolean;
  fontSize?: string;
  sidebarExpanded?: boolean;

  // Notification preferences
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  desktopNotifications?: boolean;
  notifyOnFileShared?: boolean;
  notifyOnFileCommented?: boolean;
  notifyOnFileModified?: boolean;
  notifyOnStorageWarning?: boolean;
  notifyOnSecurityAlerts?: boolean;
  digestFrequency?: string;
  emailDigestTime?: string;

  // Privacy settings
  profileVisibility?: string;
  showEmail?: boolean;
  showPhoneNumber?: boolean;
  showLastLogin?: boolean;
  allowMessages?: boolean;
  allowSearchIndexing?: boolean;
  shareActivityStatus?: boolean;

  // File & Storage preferences
  defaultFileView?: string;
  defaultSortBy?: string;
  defaultSortOrder?: string;
  autoSaveInterval?: number;
  enableFileVersioning?: boolean;
  confirmBeforeDelete?: boolean;
  showHiddenFiles?: boolean;
  thumbnailQuality?: string;
  defaultShareExpiry?: number;
  autoOrganizeFiles?: boolean;

  // Security preferences
  sessionTimeout?: number;
  requirePasswordChange?: boolean;
  enableActivityLog?: boolean;
  enableLoginAlerts?: boolean;
  trustedDevices?: any;
  ipWhitelist?: any;
  enableBiometric?: boolean;

  // Accessibility settings
  highContrast?: boolean;
  screenReaderOptimized?: boolean;
  keyboardShortcuts?: boolean;
  reducedMotion?: boolean;
  focusIndicators?: boolean;

  // Advanced preferences
  enableBetaFeatures?: boolean;
  enableAnalytics?: boolean;
  enableCrashReports?: boolean;
  developerMode?: boolean;
  customCss?: string;
  apiAccessEnabled?: boolean;
}

export class UserSettingsService {
  async getUserSettings(userId: string): Promise<UserSettings> {
    let settings = await prisma.userSettings.findUnique({
      where: { userId }
    });

    if (!settings) {
      // Create default settings for user if none exist
      settings = await prisma.userSettings.create({
        data: { userId }
      });
    }

    return settings;
  }

  async updateUserSettings(userId: string, updates: UserSettingsUpdate): Promise<UserSettings> {
    // Ensure settings record exists
    await this.getUserSettings(userId);

    const updatedSettings = await prisma.userSettings.update({
      where: { userId },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    });

    return updatedSettings;
  }

  async resetUserSettingsToDefaults(userId: string): Promise<UserSettings> {
    // Delete existing settings and create new default ones
    await prisma.userSettings.deleteMany({
      where: { userId }
    });

    const defaultSettings = await prisma.userSettings.create({
      data: { userId }
    });

    return defaultSettings;
  }

  async getUserSettingsByCategory(userId: string, category: string): Promise<Partial<UserSettings>> {
    const settings = await this.getUserSettings(userId);

    switch (category) {
      case 'profile':
        return {
          displayName: settings.displayName,
          bio: settings.bio,
          company: settings.company,
          jobTitle: settings.jobTitle,
          location: settings.location,
          website: settings.website,
          phoneNumber: settings.phoneNumber
        };

      case 'appearance':
        return {
          theme: settings.theme,
          language: settings.language,
          timezone: settings.timezone,
          dateFormat: settings.dateFormat,
          timeFormat: settings.timeFormat,
          compactMode: settings.compactMode,
          fontSize: settings.fontSize,
          sidebarExpanded: settings.sidebarExpanded
        };

      case 'notifications':
        return {
          emailNotifications: settings.emailNotifications,
          pushNotifications: settings.pushNotifications,
          desktopNotifications: settings.desktopNotifications,
          notifyOnFileShared: settings.notifyOnFileShared,
          notifyOnFileCommented: settings.notifyOnFileCommented,
          notifyOnFileModified: settings.notifyOnFileModified,
          notifyOnStorageWarning: settings.notifyOnStorageWarning,
          notifyOnSecurityAlerts: settings.notifyOnSecurityAlerts,
          digestFrequency: settings.digestFrequency,
          emailDigestTime: settings.emailDigestTime
        };

      case 'privacy':
        return {
          profileVisibility: settings.profileVisibility,
          showEmail: settings.showEmail,
          showPhoneNumber: settings.showPhoneNumber,
          showLastLogin: settings.showLastLogin,
          allowMessages: settings.allowMessages,
          allowSearchIndexing: settings.allowSearchIndexing,
          shareActivityStatus: settings.shareActivityStatus
        };

      case 'files':
        return {
          defaultFileView: settings.defaultFileView,
          defaultSortBy: settings.defaultSortBy,
          defaultSortOrder: settings.defaultSortOrder,
          autoSaveInterval: settings.autoSaveInterval,
          enableFileVersioning: settings.enableFileVersioning,
          confirmBeforeDelete: settings.confirmBeforeDelete,
          showHiddenFiles: settings.showHiddenFiles,
          thumbnailQuality: settings.thumbnailQuality,
          defaultShareExpiry: settings.defaultShareExpiry,
          autoOrganizeFiles: settings.autoOrganizeFiles
        };

      case 'security':
        return {
          sessionTimeout: settings.sessionTimeout,
          requirePasswordChange: settings.requirePasswordChange,
          enableActivityLog: settings.enableActivityLog,
          enableLoginAlerts: settings.enableLoginAlerts,
          trustedDevices: settings.trustedDevices,
          ipWhitelist: settings.ipWhitelist,
          enableBiometric: settings.enableBiometric
        };

      case 'accessibility':
        return {
          highContrast: settings.highContrast,
          screenReaderOptimized: settings.screenReaderOptimized,
          keyboardShortcuts: settings.keyboardShortcuts,
          reducedMotion: settings.reducedMotion,
          focusIndicators: settings.focusIndicators
        };

      case 'advanced':
        return {
          enableBetaFeatures: settings.enableBetaFeatures,
          enableAnalytics: settings.enableAnalytics,
          enableCrashReports: settings.enableCrashReports,
          developerMode: settings.developerMode,
          customCss: settings.customCss,
          apiAccessEnabled: settings.apiAccessEnabled
        };

      default:
        return settings;
    }
  }

  async updateUserSettingsByCategory(
    userId: string,
    category: string,
    updates: Partial<UserSettingsUpdate>
  ): Promise<Partial<UserSettings>> {
    await this.updateUserSettings(userId, updates);
    return await this.getUserSettingsByCategory(userId, category);
  }

  async deleteUserSettings(userId: string): Promise<void> {
    await prisma.userSettings.deleteMany({
      where: { userId }
    });
  }
}

export const userSettingsService = new UserSettingsService();
