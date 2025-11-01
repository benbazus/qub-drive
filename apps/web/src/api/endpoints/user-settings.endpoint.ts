import { apiClient } from '../api.client';

// Type definitions
export interface UserSettings {
  id: string;
  userId: string;

  // Profile settings
  displayName?: string;
  bio?: string;
  company?: string;
  jobTitle?: string;
  location?: string;
  website?: string;
  phoneNumber?: string;

  // Appearance preferences
  theme: string;
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  compactMode: boolean;
  fontSize: string;
  sidebarExpanded: boolean;

  // Notification preferences
  emailNotifications: boolean;
  pushNotifications: boolean;
  desktopNotifications: boolean;
  notifyOnFileShared: boolean;
  notifyOnFileCommented: boolean;
  notifyOnFileModified: boolean;
  notifyOnStorageWarning: boolean;
  notifyOnSecurityAlerts: boolean;
  digestFrequency: string;
  emailDigestTime: string;

  // Privacy settings
  profileVisibility: string;
  showEmail: boolean;
  showPhoneNumber: boolean;
  showLastLogin: boolean;
  allowMessages: boolean;
  allowSearchIndexing: boolean;
  shareActivityStatus: boolean;

  // File & Storage preferences
  defaultFileView: string;
  defaultSortBy: string;
  defaultSortOrder: string;
  autoSaveInterval: number;
  enableFileVersioning: boolean;
  confirmBeforeDelete: boolean;
  showHiddenFiles: boolean;
  thumbnailQuality: string;
  defaultShareExpiry: number;
  autoOrganizeFiles: boolean;

  // Security preferences
  sessionTimeout: number;
  requirePasswordChange: boolean;
  enableActivityLog: boolean;
  enableLoginAlerts: boolean;
  trustedDevices?: any;
  ipWhitelist?: any;
  enableBiometric: boolean;

  // Accessibility settings
  highContrast: boolean;
  screenReaderOptimized: boolean;
  keyboardShortcuts: boolean;
  reducedMotion: boolean;
  focusIndicators: boolean;

  // Advanced preferences
  enableBetaFeatures: boolean;
  enableAnalytics: boolean;
  enableCrashReports: boolean;
  developerMode: boolean;
  customCss?: string;
  apiAccessEnabled: boolean;

  createdAt: Date;
  updatedAt: Date;
}

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

export type UserSettingsCategory =
  | 'profile'
  | 'appearance'
  | 'notifications'
  | 'privacy'
  | 'files'
  | 'security'
  | 'accessibility'
  | 'advanced';

class UserSettingsEndpoint {
  private readonly endpoints = {
    userSettings: '/user-settings',
    userSettingsByCategory: (category: string) => `/user-settings/${category}`,
    reset: '/user-settings/reset',
  };

  async getUserSettings(): Promise<UserSettings> {
    const response = await apiClient.get<{ success: boolean; data: UserSettings }>(
      this.endpoints.userSettings
    );
    if (response.error || !response.data?.success || !response.data?.data) {
      throw new Error(response.error || 'Failed to get user settings');
    }
    return response.data.data;
  }

  async updateUserSettings(updates: UserSettingsUpdate): Promise<UserSettings> {
    const response = await apiClient.put<{ success: boolean; data: UserSettings }>(
      this.endpoints.userSettings,
      updates
    );
    if (response.error || !response.data?.success || !response.data?.data) {
      throw new Error(response.error || 'Failed to update user settings');
    }
    return response.data.data;
  }

  async getUserSettingsByCategory(category: UserSettingsCategory): Promise<Partial<UserSettings>> {
    const response = await apiClient.get<{ success: boolean; data: Partial<UserSettings> }>(
      this.endpoints.userSettingsByCategory(category)
    );
    if (response.error || !response.data?.success || !response.data?.data) {
      throw new Error(response.error || 'Failed to get settings by category');
    }
    return response.data.data;
  }

  async updateUserSettingsByCategory(
    category: UserSettingsCategory,
    updates: Partial<UserSettingsUpdate>
  ): Promise<Partial<UserSettings>> {
    const response = await apiClient.put<{ success: boolean; data: Partial<UserSettings> }>(
      this.endpoints.userSettingsByCategory(category),
      updates
    );
    if (response.error || !response.data?.success || !response.data?.data) {
      throw new Error(response.error || 'Failed to update settings by category');
    }
    return response.data.data;
  }

  async resetToDefaults(): Promise<UserSettings> {
    const response = await apiClient.post<{ success: boolean; data: UserSettings }>(
      this.endpoints.reset
    );
    if (response.error || !response.data?.success || !response.data?.data) {
      throw new Error(response.error || 'Failed to reset settings to defaults');
    }
    return response.data.data;
  }
}

// Create and export singleton instance
export const userSettingsEndpoint = new UserSettingsEndpoint();
export default userSettingsEndpoint;
